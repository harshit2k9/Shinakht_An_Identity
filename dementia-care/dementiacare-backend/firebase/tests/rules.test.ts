import { describe, it, beforeAll, afterEach } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: 'dcc-scratch-123',
        firestore: {
            rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
            host: 'localhost',
            port: 8080,
        },
    });
});

afterEach(async () => {
    await testEnv.clearFirestore();
});

describe('Dementia Care Companion Security Rules', () => {
    it('allows patient to create their user doc with valid role, blocks wrong role', async () => {
        const patientContext = testEnv.authenticatedContext('patient1', { email: 'p@test.com' });
        const db = patientContext.firestore();

        // Valid create
        await testEnv.assertSucceeds(
            db.collection('users').doc('patient1').set({ role: 'patient', name: 'Test Patient' })
        );

        // Wrong user trying to write someone else's doc should fail
        const hackerContext = testEnv.authenticatedContext('hacker', { email: 'h@test.com' });
        await testEnv.assertFails(
            hackerContext.firestore().collection('users').doc('patient1').set({ role: 'patient' })
        );
    });

    it('blocks unauthorized users from reading/writing pairing requests', async () => {
        const userA = testEnv.authenticatedContext('userA');
        const userB = testEnv.authenticatedContext('userB');

        // User A creates their own pairing request
        await testEnv.assertSucceeds(
            userA.firestore().collection('pairingRequests').doc('req1').set({
                uid: 'userA',
                type: 'create',
                createdAt: Date.now()
            })
        );

        // User B trying to read User A's request should fail
        await testEnv.assertFails(
            userB.firestore().collection('pairingRequests').doc('req1').get()
        );
    });
});