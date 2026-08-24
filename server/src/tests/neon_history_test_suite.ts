import { historyService } from '../services/historyService';
import { prisma } from '../config';

async function runNeonHistoryTestSuite() {
  console.log('🧪 Starting Neon Persistent History Test Suite...\n');

  const testProjectId = `test-project-${Date.now()}`;

  // 1. Ensure test project exists
  await prisma.project.create({
    data: {
      id: testProjectId,
      title: 'SIH Threat Intelligence Test Project',
      description: 'Persistent History Verification Project',
    },
  });
  console.log(`1. Test project created in database: "${testProjectId}"`);

  // 2. Create Conversation
  console.log('\n2. Testing Conversation Creation...');
  const conv = await historyService.createConversation(
    testProjectId,
    'Threat Intelligence Q&A',
    'gemini',
    'gemini-3.1-flash-lite'
  );
  if (!conv || !conv.id || conv.title !== 'Threat Intelligence Q&A') {
    throw new Error('❌ Failed to create conversation');
  }
  console.log(`  ✅ Conversation created: ID="${conv.id}", Title="${conv.title}"`);

  // 3. Save User Message
  console.log('\n3. Testing User Message Persistence...');
  const userMsg = await historyService.saveMessage({
    conversationId: conv.id,
    role: 'USER',
    content: 'What is the target release window?',
    provider: 'gemini',
    model: 'gemini-3.1-flash-lite',
  });
  if (!userMsg || userMsg.role !== 'USER' || userMsg.content !== 'What is the target release window?') {
    throw new Error('❌ Failed to save user message');
  }
  console.log(`  ✅ User message saved: ID="${userMsg.id}"`);

  // 4. Save Assistant Message with Sources
  console.log('\n4. Testing Assistant Message Persistence with Sources...');
  const sampleSources = [
    {
      documentId: 'doc-101',
      page: 3,
      title: 'SIH 2026 Technical Report.pdf',
      snippet: 'Target release window is Q3 2026.',
    },
  ];
  const asstMsg = await historyService.saveMessage({
    conversationId: conv.id,
    role: 'ASSISTANT',
    content: 'The target release window is Q3 2026.',
    provider: 'gemini',
    model: 'gemini-3.1-flash-lite',
    sources: sampleSources,
    grounded: true,
  });
  if (!asstMsg || asstMsg.role !== 'ASSISTANT' || !asstMsg.sources || asstMsg.sources.length === 0) {
    throw new Error('❌ Failed to save assistant message with sources');
  }
  console.log(`  ✅ Assistant message saved with ${asstMsg.sources.length} source citation(s)`);

  // 5. Load Full Conversation History
  console.log('\n5. Testing Load Conversation & Messages...');
  const loaded = await historyService.getConversationById(conv.id);
  if (!loaded || !loaded.conversation || loaded.messages.length !== 2) {
    throw new Error(`❌ Failed: Expected 2 messages, found ${loaded?.messages?.length}`);
  }
  console.log(`  ✅ Loaded conversation ID "${loaded.conversation.id}" with ${loaded.messages.length} messages`);

  // 6. Test Title Search & Renaming
  console.log('\n6. Testing Title Search & Renaming...');
  const searchResults = await historyService.listConversations(testProjectId, 10, 'Threat');
  if (searchResults.length === 0) {
    throw new Error('❌ Failed: Title search returned 0 results');
  }
  console.log(`  ✅ Search returned ${searchResults.length} matching conversation(s)`);

  const renamed = await historyService.renameConversation(conv.id, 'Updated Release Window Analysis');
  if (renamed.title !== 'Updated Release Window Analysis') {
    throw new Error('❌ Failed to rename conversation');
  }
  console.log(`  ✅ Renamed conversation title to: "${renamed.title}"`);

  // 7. Test Deletion
  console.log('\n7. Testing Conversation Deletion...');
  await historyService.deleteConversation(conv.id);
  const deletedCheck = await historyService.getConversationById(conv.id);
  if (deletedCheck !== null) {
    throw new Error('❌ Failed: Deleted conversation still exists');
  }
  console.log('  ✅ Conversation deleted cleanly');

  // Clean up test project
  await prisma.project.delete({ where: { id: testProjectId } });
  console.log('\n🎉 ALL NEON PERSISTENT HISTORY TESTS PASSED SUCCESSFULLY!');
}

runNeonHistoryTestSuite().catch((err) => {
  console.error('❌ Neon Persistent History Test Suite Failed:', err);
  process.exit(1);
});
