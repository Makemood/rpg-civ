#!/usr/bin/env python
# This program is dedicated to the public domain under the CC0 license.
# pylint: disable=import-error,unused-argument
"""
Simple example of a bot that uses a custom webhook setup and handles custom updates.
For the custom webhook setup, the libraries `flask`, `asgiref` and `uvicorn` are used. Please
install them as `pip install flask[async]~=2.3.2 uvicorn~=0.23.2 pip.
Note that any other `asyncio` based web server framework can be used for a custom webhook setup
just as well.

Usage:
Set bot Token, URL, admin CHAT_ID and PORT after the imports.
You may also need to change the `listen` value in the uvicorn configuration to match your setup.
Press Ctrl-C on the command line or send a signal to the process to stop the bot.
"""
import asyncio
import html
import logging
from dataclasses import dataclass
from http import HTTPStatus

import uvicorn
from asgiref.wsgi import WsgiToAsgi
from flask import Flask, Response, abort, make_response, request

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CallbackContext,
    CommandHandler,
    ContextTypes,
    ExtBot,
    TypeHandler,
)

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
# set higher logging level for httpx to avoid all GET and POST requests being logged
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Define configuration constants
URL = "https://domain.tld"
ADMIN_CHAT_ID = 123456
PORT = 8000
TOKEN = "123:ABC"  # nosec B105


@dataclass
class WebhookUpdate:
    """Simple dataclass to wrap a custom update type"""

    hash: str #used to store in a database to update score
    score: int


class CustomContext(CallbackContext[ExtBot, dict, dict, dict]):
    """
    Custom CallbackContext class that makes `user_data` available for updates of type
    `WebhookUpdate`.
    """

    @classmethod
    def from_update(
        cls,
        update: object,
        application: "Application",
    ) -> "CustomContext":
        if isinstance(update, WebhookUpdate):
            return cls(application=application, user_id=update.user_id)
        return super().from_update(update, application)


async def start(update: Update, context: CustomContext) -> None:
    await update.message.reply_html("Hello!")


async def webhook_update(update: WebhookUpdate, context: CustomContext) -> None:
    user_hash = update.payload
    score = update.score
    bot = context.bot

    conn = sqlite3.connect('players.db')
    cur = conn.cursor()
    cur.execute('SELECT user_id, game_name, inline_id FROM games WHERE hash=?', (user_hash,))
    info = cur.fetchone()
    if info:
        user_id, game_name, inline_id = info
        await bot.set_game_score(user_id=user_id, score=score, inline_message_id=inline_id)
    conn.close()

async def inline_query(update, context):
    query_id = update.inline_query.id
    results = [
        InlineQueryResultGame(
            id='1',
            game_short_name='TEST RPG'
        )
    ]
    await context.bot.answer_inline_query(inline_query_id=query_id, results=results)

async def callback_query(update, context):
    query = update.callback_query
    url = 'https://YOUR-GAME-HOST/?hash='

    if query.data == "YOURGAMESHORTNAME":
        uuid = str(uuid4())
        conn = sqlite3.connect('players.db')
        cur = conn.cursor()
        cur.execute("INSERT INTO games (user_id, hash, game_name, inline_id) VALUES (?, ?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET hash=?, game_name=?, inline_id=?", (query.from_user.id, uuid, "YOUR GAME SHORT NAME", query.inline_message_id, uuid, "YOUR GAME SHORTNAME", query.inline_message_id))
        conn.commit()
        conn.close()

        await context.bot.answer_callback_query(callback_query_id=query.id, url=url+uuid)
    else:
        await context.bot.answer_callback_query(callback_query_id=query.id, text="This does nothing.")

async def main() -> None:
    """Set up PTB application and a web application for handling the incoming requests."""
    context_types = ContextTypes(context=CustomContext)
    # Here we set updater to None because we want our custom webhook server to handle the updates
    # and hence we don't need an Updater instance
    application = (
        Application.builder().token(TOKEN).updater(None).context_types(context_types).build()
    )
    # register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(callback_query))
    application.add_handler(InlineQueryHandler(inline_query))
    application.add_handler(TypeHandler(type=WebhookUpdate, callback=webhook_update))
    # Pass webhook settings to telegram
    await application.bot.set_webhook(url=f"{URL}/telegram", allowed_updates=Update.ALL_TYPES)

    # Set up webserver
    flask_app = Flask(__name__)

    @flask_app.post("/telegram")  # type: ignore[misc]
    async def telegram() -> Response:
        """Handle incoming Telegram updates by putting them into the `update_queue`"""
        await application.update_queue.put(Update.de_json(data=request.json, bot=application.bot))
        return Response(status=HTTPStatus.OK)

    @flask_app.route("/submitpayload", methods=["GET", "POST"])  # type: ignore[misc]
    async def custom_updates() -> Response:
        """
        Handle incoming webhook updates by also putting them into the `update_queue` if
        the required parameters were passed correctly.
        """
        try:
            score = int(request.args["score"])
            hash= request.args["hash"]
        except KeyError:
            abort(
                HTTPStatus.BAD_REQUEST,
                "Please pass both `hash` and `score` as query parameters.",
            )
        except ValueError:
            abort(HTTPStatus.BAD_REQUEST, "The `score` must be a string!")

        await application.update_queue.put(WebhookUpdate(user_id=user_id, payload=payload))
        return Response(status=HTTPStatus.OK)

    @flask_app.get("/healthcheck")  # type: ignore[misc]
    async def health() -> Response:
        """For the health endpoint, reply with a simple plain text message."""
        response = make_response("The bot is still running fine :)", HTTPStatus.OK)
        response.mimetype = "text/plain"
        return response

    webserver = uvicorn.Server(
        config=uvicorn.Config(
            app=WsgiToAsgi(flask_app),
            port=PORT,
            use_colors=False,
            host="127.0.0.1",
        )
    )

    # Run application and webserver together
    async with application:
        await application.start()
        await webserver.serve()
        await application.stop()


if __name__ == "__main__":
    asyncio.run(main())