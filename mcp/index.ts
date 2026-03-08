import express from 'express';
import bodyParser from 'body-parser';
import { loadResource } from './resourceLoader';
import { createDestinationPaymentIntent } from '../lib/stripe';
import { calculateSplit } from '../lib/revenue';
import { askSwanny } from '../lib/swannyAi';
import { supabaseAdmin } from '../lib/supabase';
import { sendN8nWebhook } from '../lib/n8n';

// Simplified MCP server - handles JSON-RPC 2.0 requests.

type RpcRequest = {
    jsonrpc: '2.0';
    method: string;
    params?: any;
    id?: string | number;
};

type RpcResponse = {
    jsonrpc: '2.0';
    result?: any;
    error?: { code: number; message: string };
    id?: string | number;
};

const tools: Record<string, (params: any) => Promise<any>> = {
    async showCommandCenterDashboard() {
        return await loadResource('command-center-dashboard');
    },
    async showLiveRoom() {
        return await loadResource('live-room');
    },
    async showEarningsPage() {
        return await loadResource('earnings-page');
    },
    async showCreatorStudio() {
        return await loadResource('creator-studio');
    },
    async showDiscoverFeed() {
        return await loadResource('discover-feed');
    },
    async showDominoArena() {
        return await loadResource('domino-arena');
    },
    async processTip(params: { streamId: string; amount: number; viewerId?: string }) {
        // create stripe intent and insert transaction into database
        const { streamId, amount, viewerId } = params;
        // look up stream and creator
        const { data: stream } = await supabaseAdmin
            .from('streams')
            .select('creator_id')
            .eq('id', streamId)
            .single();
        if (!stream) throw new Error('Stream not found');
        const { data: creator } = await supabaseAdmin
            .from('profiles')
            .select('stripe_account_id')
            .eq('id', stream.creator_id)
            .single();
        if (!creator || !creator.stripe_account_id) {
            throw new Error('Creator stripe account missing');
        }
        const intent = await createDestinationPaymentIntent({
            amount,
            currency: 'usd',
            creatorStripeAccountId: creator.stripe_account_id
        });
        const { creatorAmount, platformAmount } = calculateSplit(amount);
        const { data: tx } = await supabaseAdmin.from('transactions').insert({
            id: intent.id,
            stream_id: streamId,
            viewer_id: viewerId,
            gross_amount: amount,
            creator_amount: creatorAmount,
            platform_amount: platformAmount
        }).select('*').single();
        // fire webhook for tip received
        await sendN8nWebhook(process.env.N8N_WEBHOOK_URL || '', 'tip.received', {
            transaction: tx
        });
        return intent.client_secret;
    },
    async sendChatMessage(params: { streamId: string; senderId?: string; content: any }) {
        await supabaseAdmin.from('chat_messages').insert({
            stream_id: params.streamId,
            sender_id: params.senderId,
            content: params.content
        });
        return { success: true };
    },
    async goLive(params: { streamId: string }) {
        await supabaseAdmin
            .from('streams')
            .update({ status: 'live', started_at: new Date().toISOString() })
            .eq('id', params.streamId);
        await sendN8nWebhook(process.env.N8N_WEBHOOK_URL || '', 'stream.start', {
            streamId: params.streamId
        });
        return { success: true };
    },
    async endStream(params: { streamId: string }) {
        await supabaseAdmin
            .from('streams')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', params.streamId);
        await sendN8nWebhook(process.env.N8N_WEBHOOK_URL || '', 'stream.end', {
            streamId: params.streamId
        });
        return { success: true };
    },
    async askSwaneeAIForMessage(params: {
        streamId: string;
        personality: string;
        prompt: string;
    }) {
        return askSwanny(params.streamId, params.personality as any, params.prompt);
    },
    async getStreamHealthData(params: { streamId: string }) {
        // stub: query redis or other store for health metrics
        const { data } = await supabaseAdmin
            .from('view_accounts')
            .select('revenue,duration')
            .eq('stream_id', params.streamId);
        return data;
    }
};

const app = express();
app.use(bodyParser.json());

app.post('/', async (req, res) => {
    const rpc: RpcRequest = req.body;
    const response: RpcResponse = { jsonrpc: '2.0', id: rpc.id };
    try {
        const fn = tools[rpc.method];
        if (!fn) throw new Error(`Unknown tool ${rpc.method}`);
        response.result = await fn(rpc.params || {});
    } catch (err: any) {
        response.error = { code: -32000, message: err.message || String(err) };
    }
    res.json(response);
});

const port = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 8080;
app.listen(port, () => {
    console.log(`MCP server listening on port ${port}`);
});
