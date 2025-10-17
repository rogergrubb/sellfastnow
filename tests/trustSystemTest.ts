// Trust System Test Suite
// Comprehensive tests for all trust system functionality

import { PrismaClient } from '@prisma/client';
import { trustScoreService } from '../services/trustScoreService';

const prisma = new PrismaClient();

// Test data
const testUserId = 'test_user_' + Date.now();

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logTest(test: string, passed: boolean, message: string, data?: any) {
  results.push({ test, passed, message, data });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

async function runTests() {
  console.log('🧪 Starting Trust System Test Suite\n');
  console.log('═'.repeat(60));
  
  try {
    // Test 1: Initialize Trust Score
    console.log('\n📋 Test 1: Initialize Trust Score');
    await testInitializeTrustScore();
    
    // Test 2: Verification Updates
    console.log('\n📋 Test 2: Verification Updates');
    await testVerificationUpdates();
    
    // Test 3: Transaction Metrics
    console.log('\n📋 Test 3: Transaction Metrics');
    await testTransactionMetrics();
    
    // Test 4: Review Metrics
    console.log('\n📋 Test 4: Review Metrics');
    await testReviewMetrics();
    
    // Test 5: Listing Metrics
    console.log('\n📋 Test 5: Listing Metrics');
    await testListingMetrics();
    
    // Test 6: Responsiveness Metrics
    console.log('\n📋 Test 6: Responsiveness Metrics');
    await testResponsivenessMetrics();
    
    // Test 7: Flag Recording
    console.log('\n📋 Test 7: Flag Recording');
    await testFlagRecording();
    
    // Test 8: Trust Badges
    console.log('\n📋 Test 8: Trust Badges');
    await testTrustBadges();
    
    // Test 9: Trust Requirements
    console.log('\n📋 Test 9: Trust Requirements');
    await testTrustRequirements();
    
    // Test 10: Score Calculation
    console.log('\n📋 Test 10: Overall Score Calculation');
    await testScoreCalculation();
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await cleanup();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`);
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

async function testInitializeTrustScore() {
  try {
    // Create test user first
    await prisma.$executeRaw`
      INSERT INTO users (id, email, display_name)
      VALUES (${testUserId}, 'test@example.com', 'Test User')
      ON CONFLICT (id) DO NOTHING
    `;
    
    await trustScoreService.initializeUserTrust(testUserId);
    
    const score = await trustScoreService.getTrustScore(testUserId);
    
    if (score && score.overallScore === 0 && score.scoreLevel === 'new') {
      logTest(
        'Initialize trust score',
        true,
        'Trust score initialized successfully',
        { overallScore: score.overallScore, level: score.scoreLevel }
      );
    } else {
      logTest('Initialize trust score', false, 'Score not initialized correctly', score);
    }
  } catch (error) {
    logTest('Initialize trust score', false, `Error: ${error}`);
  }
}

async function testVerificationUpdates() {
  try {
    // Test email verification
    await trustScoreService.updateVerification(testUserId, 'email', true);
    let score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.emailVerified && score.verificationScore > 0) {
      logTest('Email verification', true, 'Email verified successfully', {
        verificationScore: score.verificationScore,
      });
    } else {
      logTest('Email verification', false, 'Email verification failed', score);
    }
    
    // Test phone verification
    await trustScoreService.updateVerification(testUserId, 'phone', true);
    score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.phoneVerified && score.verificationScore > 20) {
      logTest('Phone verification', true, 'Phone verified successfully', {
        verificationScore: score.verificationScore,
      });
    } else {
      logTest('Phone verification', false, 'Phone verification failed', score);
    }
    
    // Test ID verification
    await trustScoreService.updateVerification(testUserId, 'id', true);
    score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.idVerified && score.verificationScore > 40) {
      logTest('ID verification', true, 'ID verified successfully', {
        verificationScore: score.verificationScore,
      });
    } else {
      logTest('ID verification', false, 'ID verification failed', score);
    }
  } catch (error) {
    logTest('Verification updates', false, `Error: ${error}`);
  }
}

async function testTransactionMetrics() {
  try {
    // Test completed transaction
    await trustScoreService.updateTransactionMetrics(
      testUserId,
      'tx_test_1',
      'completed',
      99.99
    );
    
    let score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.totalTransactions === 1 && score.successfulTransactions === 1) {
      logTest('Completed transaction', true, 'Transaction recorded successfully', {
        total: score.totalTransactions,
        successful: score.successfulTransactions,
      });
    } else {
      logTest('Completed transaction', false, 'Transaction not recorded', score);
    }
    
    // Test multiple transactions
    for (let i = 2; i <= 5; i++) {
      await trustScoreService.updateTransactionMetrics(
        testUserId,
        `tx_test_${i}`,
        'completed',
        50.0
      );
    }
    
    score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.totalTransactions === 5 && score.transactionScore > 0) {
      logTest('Multiple transactions', true, 'All transactions recorded', {
        total: score.totalTransactions,
        transactionScore: score.transactionScore,
      });
    } else {
      logTest('Multiple transactions', false, 'Transactions not recorded correctly', score);
    }
    
    // Test disputed transaction
    await trustScoreService.updateTransactionMetrics(
      testUserId,
      'tx_disputed',
      'disputed'
    );
    
    score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.disputedTransactions === 1) {
      logTest('Disputed transaction', true, 'Dispute recorded successfully', {
        disputed: score.disputedTransactions,
      });
    } else {
      logTest('Disputed transaction', false, 'Dispute not recorded', score);
    }
  } catch (error) {
    logTest('Transaction metrics', false, `Error: ${error}`);
  }
}

async function testReviewMetrics() {
  try {
    // Test first review
    await trustScoreService.updateReviewMetrics(testUserId, 'review_1', 5);
    
    let score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.totalReviews === 1 && score.averageRating === 5) {
      logTest('First review', true, '5-star review recorded', {
        totalReviews: score.totalReviews,
        averageRating: score.averageRating,
      });
    } else {
      logTest('First review', false, 'Review not recorded correctly', score);
    }
    
    // Test multiple reviews with different ratings
    await trustScoreService.updateReviewMetrics(testUserId, 'review_2', 4);
    await trustScoreService.updateReviewMetrics(testUserId, 'review_3', 5);
    await trustScoreService.updateReviewMetrics(testUserId, 'review_4', 3);
    
    score = await trustScoreService.getTrustScore(testUserId);
    
    const expectedAvg = (5 + 4 + 5 + 3) / 4;
    const actualAvg = score?.averageRating || 0;
    
    if (score?.totalReviews === 4 && Math.abs(actualAvg - expectedAvg) < 0.01) {
      logTest('Multiple reviews', true, 'Average calculated correctly', {
        totalReviews: score.totalReviews,
        averageRating: score.averageRating,
        expected: expectedAvg,
      });
    } else {
      logTest('Multiple reviews', false, 'Average calculation incorrect', {
        expected: expectedAvg,
        actual: actualAvg,
      });
    }
  } catch (error) {
    logTest('Review metrics', false, `Error: ${error}`);
  }
}

async function testListingMetrics() {
  try {
    // Test listing created
    await trustScoreService.updateListingMetrics(testUserId, 'listing_1', 'created');
    
    let score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.listingsCreated === 1) {
      logTest('Listing created', true, 'Listing creation recorded', {
        listingsCreated: score.listingsCreated,
      });
    } else {
      logTest('Listing created', false, 'Listing creation not recorded', score);
    }
    
    // Test listing sold
    await trustScoreService.updateListingMetrics(testUserId, 'listing_1', 'sold');
    
    score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.listingsSold === 1) {
      logTest('Listing sold', true, 'Listing sale recorded', {
        listingsSold: score.listingsSold,
        completionRate: score.listingCompletionRate,
      });
    } else {
      logTest('Listing sold', false, 'Listing sale not recorded', score);
    }
  } catch (error) {
    logTest('Listing metrics', false, `Error: ${error}`);
  }
}

async function testResponsivenessMetrics() {
  try {
    // Test quick response
    await trustScoreService.updateResponsivenessMetrics(testUserId, 3, 'msg_1');
    
    let score = await trustScoreService.getTrustScore(testUserId);
    
    if (score && score.avgResponseTimeMinutes === 3) {
      logTest('Quick response', true, 'Response time recorded', {
        avgResponseTime: score.avgResponseTimeMinutes,
      });
    } else {
      logTest('Quick response', false, 'Response time not recorded', score);
    }
    
    // Test multiple responses
    await trustScoreService.updateResponsivenessMetrics(testUserId, 10, 'msg_2');
    await trustScoreService.updateResponsivenessMetrics(testUserId, 5, 'msg_3');
    
    score = await trustScoreService.getTrustScore(testUserId);
    const expectedAvg = (3 + 10 + 5) / 3;
    
    if (score && Math.abs(score.avgResponseTimeMinutes! - expectedAvg) < 0.01) {
      logTest('Multiple responses', true, 'Average response time calculated', {
        avgResponseTime: score.avgResponseTimeMinutes,
        expected: expectedAvg,
      });
    } else {
      logTest('Multiple responses', false, 'Average response time incorrect', score);
    }
  } catch (error) {
    logTest('Responsiveness metrics', false, `Error: ${error}`);
  }
}

async function testFlagRecording() {
  try {
    await trustScoreService.recordFlag(
      testUserId,
      'Test flag reason',
      'admin_user',
      'listing',
      'listing_test'
    );
    
    const score = await trustScoreService.getTrustScore(testUserId);
    
    if (score?.flagsReceived === 1) {
      logTest('Flag recording', true, 'Flag recorded successfully', {
        flags: score.flagsReceived,
        riskLevel: score.riskLevel,
      });
    } else {
      logTest('Flag recording', false, 'Flag not recorded', score);
    }
  } catch (error) {
    logTest('Flag recording', false, `Error: ${error}`);
  }
}

async function testTrustBadges() {
  try {
    const score = await trustScoreService.getTrustScore(testUserId);
    
    if (!score) {
      logTest('Trust badges', false, 'Could not fetch score');
      return;
    }
    
    const badges = trustScoreService.getTrustBadges(score);
    
    // Should have at least verification badge
    const hasVerificationBadge = badges.some(b => b.id === 'verified_identity');
    
    if (badges.length > 0) {
      logTest('Trust badges', true, 'Badges generated successfully', {
        badgeCount: badges.length,
        badges: badges.map(b => b.name),
      });
    } else {
      logTest('Trust badges', false, 'No badges generated', { score });
    }
  } catch (error) {
    logTest('Trust badges', false, `Error: ${error}`);
  }
}

async function testTrustRequirements() {
  try {
    // Test requirement that should pass
    const passResult = await trustScoreService.checkTrustRequirement(testUserId, {
      minScore: 0,
      requiredVerifications: ['email'],
    });
    
    if (passResult.allowed) {
      logTest('Trust requirement (pass)', true, 'Requirement check passed', passResult);
    } else {
      logTest('Trust requirement (pass)', false, 'Should have passed', passResult);
    }
    
    // Test requirement that should fail
    const failResult = await trustScoreService.checkTrustRequirement(testUserId, {
      minScore: 900,
      requiredVerifications: ['email', 'phone', 'id'],
    });
    
    if (!failResult.allowed && failResult.reasons.length > 0) {
      logTest('Trust requirement (fail)', true, 'Requirement check failed correctly', failResult);
    } else {
      logTest('Trust requirement (fail)', false, 'Should have failed', failResult);
    }
  } catch (error) {
    logTest('Trust requirements', false, `Error: ${error}`);
  }
}

async function testScoreCalculation() {
  try {
    const newScore = await trustScoreService.calculateTrustScore(testUserId);
    const scoreData = await trustScoreService.getTrustScore(testUserId);
    
    if (newScore > 0 && scoreData) {
      logTest('Score calculation', true, 'Overall score calculated', {
        overallScore: newScore,
        level: scoreData.scoreLevel,
        breakdown: {
          verification: scoreData.verificationScore,
          transaction: scoreData.transactionScore,
          reputation: scoreData.reputationScore,
          activity: scoreData.activityScore,
          responsiveness: scoreData.responsivenessScore,
        },
      });
    } else {
      logTest('Score calculation', false, 'Score not calculated', { newScore, scoreData });
    }
    
    // Test breakdown
    const breakdown = trustScoreService.getTrustBreakdown(scoreData!);
    
    if (breakdown && breakdown.components.length === 5) {
      logTest('Score breakdown', true, 'Breakdown generated successfully', {
        componentCount: breakdown.components.length,
        overall: breakdown.overall,
      });
    } else {
      logTest('Score breakdown', false, 'Breakdown not generated correctly', breakdown);
    }
  } catch (error) {
    logTest('Score calculation', false, `Error: ${error}`);
  }
}

async function cleanup() {
  try {
    // Delete test data
    await prisma.$executeRaw`
      DELETE FROM trust_events WHERE user_id = ${testUserId}
    `;
    await prisma.$executeRaw`
      DELETE FROM trust_scores WHERE user_id = ${testUserId}
    `;
    await prisma.$executeRaw`
      DELETE FROM users WHERE id = ${testUserId}
    `;
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the tests
runTests();
