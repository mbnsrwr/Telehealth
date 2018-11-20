/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */
const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const IdentityIssue = require('composer-cli').Identity.Issue;
const NetworkPing = require('composer-cli').Network.Ping;

const hlc_idCard = require('composer-common').IdCard;
const path = require('path');
const _home = require('os').homedir();

require('chai').should();

const helper = require('./helper');
const network = 'telehealth';
const _timeout = 90000;
const NS = 'org.telehealth';

// test participant resources
let testDoctor;
let testPatient;
let testAppointment;

// registries
let doctorRegistry;
let patientRegistry;
let appointmentRegistry;
/**
* Reconnect using a different identity.
* @param {String} cardName The name of the card for the identity to use
*/
function uuid() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

describe('Telehealth Network', () => {
    // this.timeout(_timeout);
    let bnc;
    before(function () {
        bnc = new BusinessNetworkConnection();
        return bnc.connect('admin@telehealth');
    });
    before(async () => {
        /*
        // Embedded connection used for local testing
        const connectionProfile = {
            name: 'embedded',
            'x-type': 'embedded'
        };
        // Generate certificates for use with the embedded connection
        const credentials = CertificateUtil.generate({ commonName: 'admin' });

        // Identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: ['PeerAdmin', 'ChannelAdmin']
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);
        const deployerCardName = 'PeerAdmin';

        adminConnection = new AdminConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);
        */
    });

    /**
     *
     * @param {String} cardName The card name to use for this identity
     * @param {Object} identity The identity details
    async function importCardForIdentity(cardName, identity) {
        const metadata = {
            userName: identity.userID,
            version: 1,
            enrollmentSecret: identity.userSecret,
            businessNetwork: businessNetworkName
        };
        const card = new IdCard(metadata, connectionProfile);
        await adminConnection.importCard(cardName, card);
    }
    // This is called before each test is executed.
//    beforeEach(async () => {
        // Get the factory for the business network.
        // let factory = bnc.getBusinessNetwork().getFactory();
        const doctorRegistry = await bnc.getParticipantRegistry(NS + '.Doctor');
        const patientRegistry = await bnc.getParticipantRegistry(NS + '.Patient');
        const appointmentRegistry = await bnc.getAssetRegistry(NS + '.Appointment');

        testDoctor = helper.createDoctor(NS, factory, 'test-doctor');
        testPatient = helper.createPatient(NS, factory, 'test-patient');
        testAppointment = helper.createAppointment(NS, factory, 'test-doctor', testDoctor, testPatient);

        await doctorRegistry.addAll([testDoctor]);
        await patientRegistry.addAll([testPatient]);
        await appointmentRegistry.addAll([testAppointment]);

//    });

/**
     * Reconnect using a different identity.
     * @param {String} cardName The name of the card for the identity to use
     */
    /*
    async function useIdentity(cardName) {
        await businessNetworkConnection.disconnect();
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        events = [];
        businessNetworkConnection.on('event', (event) => {
            events.push(event);
        });
        await businessNetworkConnection.connect(cardName);
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();
    }
    */
    //  First Test
    it('Create Appointment', async () => {
        // Use the identity for Alice.
        // await useIdentity(adminCardName);

        const factory = bnc.getBusinessNetwork().getFactory();
        const doctorRegistry = await bnc.getParticipantRegistry(NS + '.Doctor');
        const patientRegistry = await bnc.getParticipantRegistry(NS + '.Patient');
        let id = uuid();
        testDoctor = helper.createDoctor(NS, factory, id);
        testPatient = helper.createPatient(NS, factory, id + 1);
        //testAppointment
        await doctorRegistry.addAll([testDoctor]);
        /*
        let options = {
            card: 'admin@telehealth',
            file: 'doc2',
            newUserId: 'Doc2',
            participantId: 'resource:org.telehealth.Doctor#' + id
        };
        await IdentityIssue.handler(options);
        const CardImport = require('composer-cli').Card.Import;
        let importoptions = {
            file: 'doc.card',
            card: 'doc2@telehealth'
        };
        */
        console.log('id ' + id);
        await patientRegistry.addAll([testPatient]);
        // transatction
        const RequestAppointTrans = factory.newTransaction(NS, 'RequestAppoint');
        RequestAppointTrans.date = '2018-12-08';
        RequestAppointTrans.time = '10.30';
        RequestAppointTrans.doctor = factory.newRelationship(NS, 'Doctor', testDoctor.$identifier);
        RequestAppointTrans.patient = factory.newRelationship(NS, 'Patient', testPatient.$identifier);
        console.log('testDoctor.$identifier ' + testDoctor.$identifier);
        await bnc.submitTransaction(RequestAppointTrans);
        appointmentRegistry = await bnc.getAssetRegistry(NS + '.Appointment');
        const allAppointments = await appointmentRegistry.getAll();
        allAppointments.length.should.equal(18);
    });

    it('Cancel Appointment', async () => {
        const factory = bnc.getBusinessNetwork().getFactory();
        appointmentRegistry = await bnc.getAssetRegistry(NS + '.Appointment');
        const allAppointments = await appointmentRegistry.getAll();
        let i = 0;
        for (i; i < allAppointments.length; i++) {
            //console.log(allAppointments[i].status);
        }
        // transatction
        const CancelAppointTrans = factory.newTransaction(NS, 'CancelAppoint');
        CancelAppointTrans.appointment = await factory.newRelationship(NS, 'Appointment', allAppointments[i - 1].$identifier);
        await bnc.submitTransaction(CancelAppointTrans);
        await allAppointments[i - 1].status.should.equal(JSON.stringify(appointStatus.Cancelled.text));
    });
    it('Issue Identity', async () => {
        const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
        let businessNetworkConnection = new BusinessNetworkConnection();
        try {
            await businessNetworkConnection.connect('admin@telehealth');
            let identityRegistry = await businessNetworkConnection.getIdentityRegistry();
            let identities = await identityRegistry.getAll();
            identities.forEach((identity) => {
                console.log(`identityId = ${identity.identityId}, name = ${identity.name}, state = ${identity.state}`);
            });
            await businessNetworkConnection.disconnect();
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    });
});

var appointStatus = {
    Created: { code: 1, text: 'Appointment Created' },
    Confirmed: { code: 2, text: 'Appointment Confirmed' },
    In_session: { code: 3, text: 'Appointment In_session' },
    Completed: { code: 4, text: 'Appointment Completed' },
    Cancelled: { code: 5, text: 'Appointment Cancelled' },
    Dispute: { code: 6, text: 'Appointment Disputed' },
    Resolve: { code: 7, text: 'Appointment Dispute Resolved' },
    PayRequest: { code: 10, text: 'Payment Requested' },
    Authorize: { code: 11, text: 'Payment Approved' },
    Paid: { code: 12, text: 'Payment Processed' }
};