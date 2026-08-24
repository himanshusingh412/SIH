import { agentService } from '../services/agentService';
import { prisma } from '../config';

async function runAgentHarnessTestSuite() {
  console.log('🧪 Starting Agent Hallucination & Fact Test Harness Suite...\n');

  // 1. Seed or resolve test project and agent
  const testProject = await prisma.project.create({
    data: {
      title: 'Test Harness Verification Project',
      description: 'Fact validation benchmark test',
    },
  });

  const spine = await prisma.contentSpine.create({
    data: {
      projectId: testProject.id,
      summary: 'Verified Incident Report: 11 systems affected on 21 October 2026.',
      version: 1,
      facts: {
        create: [
          {
            factKey: 'affected_systems',
            factValue: '11 systems affected',
            category: 'METRIC',
            isLocked: true,
          },
          {
            factKey: 'incident_date',
            factValue: '21 October 2026',
            category: 'DATE',
            isLocked: true,
          },
        ],
      },
    },
  });

  console.log('  Testing Agent Creation / Resolution...');
  const agent = await agentService.getOrCreateAgent(testProject.id);
  if (!agent || !agent.id) {
    throw new Error('❌ Failed to get or create agent record');
  }
  console.log('  ✅ Agent Created / Resolved:', agent.name);

  console.log('\n  Testing Real Agent Test Harness Execution...');
  const testReport = await agentService.runAgentTest(agent.id, [
    { query: 'How many systems were affected?', expectedAnswerSnippet: '11' },
    { query: 'What date did the incident occur?', expectedAnswerSnippet: '21 October 2026' },
    { query: 'Who is the president of Mars?', expectedAnswerSnippet: 'Not in source.' },
  ], testProject.id);

  if (testReport.status !== 'completed' || testReport.summary.total !== 3) {
    throw new Error(`❌ Test harness returned unexpected structure: ${JSON.stringify(testReport)}`);
  }

  console.log('  ✅ Test Harness Output Validated:');
  console.log(`     Total: ${testReport.summary.total} | Passed: ${testReport.summary.passed} | Failed: ${testReport.summary.failed} | Pass Rate: ${testReport.summary.passRate}`);

  for (const t of testReport.tests) {
    console.log(`     - [${t.status.toUpperCase()}] ${t.name} -> Query: "${t.query}"`);
  }

  if (testReport.summary.passed < 3) {
    throw new Error(`❌ Expected all 3 test harness scenarios to pass, got ${testReport.summary.passed}`);
  }

  // Cleanup test project
  await prisma.agentTest.deleteMany({ where: { agentId: agent.id } });
  await prisma.agentSession.deleteMany({ where: { agentId: agent.id } });
  await prisma.agent.delete({ where: { id: agent.id } });
  await prisma.fact.deleteMany({ where: { contentSpineId: spine.id } });
  await prisma.contentSpine.delete({ where: { id: spine.id } });
  await prisma.project.delete({ where: { id: testProject.id } });

  console.log('\n🎉 ALL AGENT TEST HARNESS VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}

runAgentHarnessTestSuite().catch((err) => {
  console.error('❌ Agent Test Suite Failed:', err);
  process.exit(1);
});
