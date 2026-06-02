import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TENANT_ID } from '@/lib/ai-agent';

type Task = {
  id: string;
  name: string;
  tagId: string;
  messageTemplate: string;
  type: 'upsell' | 'retorno' | 'qualificacao';
  status: 'pending' | 'running' | 'completed' | 'failed';
  runCount: number;
  successCount: number;
  createdAt: string;
  chipInstance?: string;
};

async function getTenant() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tenants')
    .select('id, features')
    .eq('id', DEFAULT_TENANT_ID)
    .single();
  if (error) throw error;
  return data;
}

function getTasks(features: any): Task[] {
  return Array.isArray(features?.tasks) ? features.tasks : [];
}

async function saveTasks(tasks: Task[]) {
  const supabase = getSupabaseAdmin();
  const tenant = await getTenant();
  const features = { ...(tenant.features || {}), tasks };
  const { error } = await supabase.from('tenants').update({ features }).eq('id', DEFAULT_TENANT_ID);
  if (error) throw error;
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  try {
    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: 'taskId é obrigatório' }, { status: 400 });
    }

    const tenant = await getTenant();
    const tasks = getTasks(tenant.features);
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    const task = tasks[taskIndex];

    // Atualiza status para 'running' no banco
    task.status = 'running';
    await saveTasks(tasks);

    // Buscar contatos/conversas com a tag vinculada
    const { data: junctionRows, error: junctionErr } = await supabase
      .from('conversation_tags')
      .select('conversation_id')
      .eq('tag_id', task.tagId);

    if (junctionErr) throw junctionErr;

    const conversationIds = junctionRows?.map((r) => r.conversation_id) || [];
    if (conversationIds.length === 0) {
      task.status = 'completed';
      task.runCount = 0;
      task.successCount = 0;
      await saveTasks(tasks);
      return NextResponse.json({ success: true, message: 'Nenhum contato encontrado com esta tag.', sent: 0, total: 0 });
    }

    const { data: conversations, error: convsErr } = await supabase
      .from('conversations')
      .select('id, tenant_id, channel_identifier, contact_name')
      .in('id', conversationIds);

    if (convsErr || !conversations) throw convsErr || new Error('Erro ao carregar conversas');

    let successCount = 0;
    const totalCount = conversations.length;

    const evoUrl = 'https://b2zap-evolution-api.yagj5r.easypanel.host';
    const evoKey = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    const instance = task.chipInstance || 'b2zap';

    for (const conv of conversations) {
      try {
        // Personaliza a mensagem
        const contactName = conv.contact_name || 'Cliente';
        const messageText = task.messageTemplate.replace(/{nome}/g, contactName);

        // Insere a mensagem no banco do CRM (outgoing)
        const { data: msg, error: msgErr } = await supabase
          .from('messages')
          .insert({
            conversation_id: conv.id,
            tenant_id: conv.tenant_id,
            role: 'assistant',
            content: messageText,
            type: 'text',
            direction: 'outgoing',
            ai_generated: false,
            status: 'sent'
          })
          .select()
          .single();

        if (msgErr || !msg) {
          console.error('Erro ao inserir mensagem de tarefa no banco:', msgErr?.message);
          continue;
        }

        // Dispara via WhatsApp (Evolution API)
        const number = conv.channel_identifier;
        const evoRes = await fetch(`${evoUrl}/message/sendText/${instance}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': evoKey },
          body: JSON.stringify({ number, text: messageText }),
        });

        const evoData = evoRes.ok ? await evoRes.json().catch(() => ({})) : null;

        if (evoRes.ok && evoData?.key?.id) {
          await supabase.from('messages').update({ evolution_msg_id: evoData.key.id }).eq('id', msg.id);
          successCount++;
        } else {
          const txt = await evoRes.text().catch(() => '');
          console.error('Falha de envio via Evolution:', evoRes.status, txt);
          await supabase.from('messages').update({ status: 'failed' }).eq('id', msg.id);
        }

        // Adiciona um pequeno atraso de 1 segundo entre disparos para evitar spam
        await new Promise((resolve) => setTimeout(resolve, 1000));

      } catch (err) {
        console.error('Erro ao disparar mensagem para conversa:', conv.id, err);
      }
    }

    // Atualiza a tarefa final no banco
    const reloadTenant = await getTenant();
    const currentTasks = getTasks(reloadTenant.features);
    const idx = currentTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      currentTasks[idx].status = 'completed';
      currentTasks[idx].runCount = totalCount;
      currentTasks[idx].successCount = successCount;
      await saveTasks(currentTasks);
    }

    return NextResponse.json({
      success: true,
      message: `Disparos concluídos. ${successCount}/${totalCount} enviados com sucesso.`,
      sent: successCount,
      total: totalCount,
    });

  } catch (error: any) {
    console.error('Erro ao rodar tarefa:', error);
    // Tenta resetar para failed
    try {
      const reloadTenant = await getTenant();
      const currentTasks = getTasks(reloadTenant.features);
      const idx = currentTasks.findIndex((t: any) => t.id === req.body); // Fallback
      if (idx !== -1) {
        currentTasks[idx].status = 'failed';
        await saveTasks(currentTasks);
      }
    } catch {}
    return NextResponse.json({ error: error?.message || 'Erro ao processar a tarefa' }, { status: 500 });
  }
}
