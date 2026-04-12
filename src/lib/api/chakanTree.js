/**
 * src/lib/api/chakanTree.js
 * Chakan Tree API functions.
 */

import api from './client';
import { ENDPOINTS } from './endpoints';

export async function getChakanTreeInfo() {
  try { return await api.get(ENDPOINTS.CHAKAN_TREE.INFO); } catch { return getMockInfo(); }
}

export async function joinChakanTree(options = {}) {
  try { return await api.post(ENDPOINTS.CHAKAN_TREE.JOIN, options); }
  catch {
    return { success: true, membership: { referralCode: 'CKC' + Math.random().toString(36).slice(2,8).toUpperCase(), joinedAt: new Date().toISOString(), tier: 'seed', isActive: true } };
  }
}

export async function getDashboard() {
  try { return await api.get(ENDPOINTS.CHAKAN_TREE.DASHBOARD); } catch { return getMockDashboard(); }
}

export async function getImpact() {
  try { return await api.get(ENDPOINTS.CHAKAN_TREE.IMPACT); } catch { return getMockImpact(); }
}

function getMockInfo() {
  return { name: 'Chakan Tree', description: 'A participatory value-sharing system where tea lovers help extend a fairer tea value chain.', stats: { totalParticipants: 1247, totalValueShared: '$38,420', countriesReached: 34 }, tiers: [{ id: 'seed', label: 'Seed', minReferrals: 0, reward: '5% of referral purchases' }, { id: 'sprout', label: 'Sprout', minReferrals: 5, reward: '7% + early access' }, { id: 'tree', label: 'Tree', minReferrals: 20, reward: '10% + estate visit ballot' }] };
}

function getMockDashboard() {
  return { referrals: [{ id: 'r1', name: 'Sarah M.', joinedAt: new Date(Date.now()-5*86400000).toISOString(), purchases: 2, valueGenerated: 38.00 }, { id: 'r2', name: 'James K.', joinedAt: new Date(Date.now()-12*86400000).toISOString(), purchases: 1, valueGenerated: 16.99 }, { id: 'r3', name: 'Priya S.', joinedAt: new Date(Date.now()-30*86400000).toISOString(), purchases: 4, valueGenerated: 87.50 }], rewards: { totalEarned: 14.22, pendingPayout: 7.10, paidOut: 7.12, currency: 'USD' } };
}

function getMockImpact() {
  return { teaPickersSupported: 12, communityFunds: '$240', totalValueShared: '$142.49', treesPlanted: 3 };
}

export default { getChakanTreeInfo, joinChakanTree, getDashboard, getImpact };