import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    GLOBAL_GROUP = 'chat_global'

    async def connect(self):
        query = parse_qs(self.scope['query_string'].decode())
        user_id = query.get('user_id', [None])[0]

        self.groups_joined = [self.GLOBAL_GROUP]
        if user_id:
            self.groups_joined.append(f'user_{user_id}')

        for group in self.groups_joined:
            await self.channel_layer.group_add(group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        for group in getattr(self, 'groups_joined', [self.GLOBAL_GROUP]):
            await self.channel_layer.group_discard(group, self.channel_name)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['data']))
