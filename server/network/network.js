'use strict';
const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');

//declate namespace
const namespace = 'org.telehealth';

function uuid() {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
//in-memory card store for testing so cards are not persisted to the file system
const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore({ type: 'composer-wallet-inmemory' });

//admin connection to the blockchain, used to deploy the business network
let adminConnection;

//this is the business network connection the tests will use.
let businessNetworkConnection;

let businessNetworkName = 'telehealth';
let factory;


/*
 * Import card for an identity
 * @param {String} cardName The card name to use for this identity
 * @param {Object} identity The identity details
 */
async function importCardForIdentity(cardName, identity) {

  //use admin connection
  adminConnection = new AdminConnection();
  businessNetworkName = 'telehealth';

  //declare metadata
  const metadata = {
    userName: identity.userID,
    version: 1,
    enrollmentSecret: identity.userSecret,
    businessNetwork: businessNetworkName
  };

  //get connectionProfile from json, create Idcard
  const connectionProfile = require('./connection.json');
  const card = new IdCard(metadata, connectionProfile);

  //import card
  await adminConnection.importCard(cardName, card);
}


/*
* Reconnect using a different identity
* @param {String} cardName The identity to use
*/
async function useIdentity(cardName) {

  //disconnect existing connection
  await businessNetworkConnection.disconnect();

  //connect to network using cardName
  businessNetworkConnection = new BusinessNetworkConnection();
  await businessNetworkConnection.connect(cardName);
}


//export module
module.exports = {

  /*
  * Create Member participant and import card for identity
  * @param {String} cardId Import card id for member
  * @param {String} accountNumber Member account number as identifier on network
  * @param {String} firstName Member first name
  * @param {String} lastName Member last name
  * @param {String} phoneNumber Member phone number
  */
  registerPatient: async function (cardId, accountNumber, firstName, lastName, gender, dob) {
    try {

      //connect as admin
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect('admin@telehealth');

      //get the factory for the business network
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create member participant
      const patient = factory.newResource(namespace, 'Patient', accountNumber);
      patient.fName = firstName;
      patient.lName = lastName;
      patient.gender = gender;
      patient.dob = dob;

      //add member participant
      const participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.Patient');
      await participantRegistry.add(patient);

      //issue identity
      const identity = await businessNetworkConnection.issueIdentity(namespace + '.Patient#' + accountNumber, cardId);

      //import card for identity
      await importCardForIdentity(cardId, identity);

      //disconnect
      await businessNetworkConnection.disconnect('admin@telehealth');

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
  * Create Partner participant and import card for identity
  * @param {String} cardId Import card id for partner
  * @param {String} partnerId Partner Id as identifier on network
  * @param {String} name Partner name
  */
  registerDoctor: async function (cardId, doctorId, firstName, lastName, gender, exp, specl, dob) {

    try {

      //connect as admin
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect('admin@telehealth');

      //get the factory for the business network.
      factory = await businessNetworkConnection.getBusinessNetwork().getFactory();

      //create partner participant
      const doctor = factory.newResource(namespace, 'Doctor', doctorId);
      doctor.fName = firstName;
      doctor.lName = lastName;
      doctor.gender = gender;
      doctor.dob = dob;
      doctor.speciality = specl;
      doctor.experience = exp;
      console.log(doctor);
      //add partner participant
      const participantRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.Doctor');
      const doc = await participantRegistry.add(doctor);
      console.log('Registry' + participantRegistry);
      console.log('doctor added' + doc);
      //issue identity
      const identity = await businessNetworkConnection.issueIdentity(namespace + '.Doctor#' + doctorId, cardId);
      console.log('identity' + identity);
      //import card for identity
      await importCardForIdentity(cardId, identity);
      console.log('identity');
      //disconnect
      await businessNetworkConnection.disconnect('admin@telehealth');

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },
  /*
    * Perform requestAppoint transaction
    * @param {String} cardId Card id to connect to network
    * @param {String} accountNumber Account number of member
    * @param {String} doctorId Partner Id of doctor
    * @param {String} points Points date
    * @param {String} points Points time
    */
  requestAppointTransaction: async function (cardId, accountNumber, date, time, doctorId) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      const RequestAppointTrans = factory.newTransaction(namespace, 'RequestAppoint');
      RequestAppointTrans.date = date;
      RequestAppointTrans.time = time;
      RequestAppointTrans.doctor = factory.newRelationship(namespace, 'Doctor', doctorId);
      RequestAppointTrans.patient = factory.newRelationship(namespace, 'Patient', accountNumber);

      //submit transaction
      await businessNetworkConnection.submitTransaction(RequestAppointTrans);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },
  /*
  * Perform CancelAppointment transaction
  * @param {String} cardId Card id to connect to network
  * @param {String} accountNumber Account number of member
  * @param {String} partnerId Partner Id of partner
  * @param {Integer} points Points value
  */
  cancelAppointTrans: async function (cardId, accountNumber, appointId) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect('admin@telehealth');

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      const CancelAppointTrans = factory.newTransaction(namespace, 'CancelAppoint');
      CancelAppointTrans.appointment = await factory.newRelationship(namespace, 'Appointment', appointId);
      console.log(CancelAppointTrans);
      //submit transaction
      await businessNetworkConnection.submitTransaction(CancelAppointTrans);

      //disconnect
      await businessNetworkConnection.disconnect();

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
    * Perform ConfirmAppointment transaction
    * @param {String} cardId Card id to connect to network
    * @param {String} accountNumber Account number of member
    * @param {String} partnerId Partner Id of partner
    * @param {Integer} points Points value
    */
  confirmAppointTrans: async function (cardId, accountNumber, check, appointId) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      const ConfirmAppointTrans = factory.newTransaction(namespace, 'ConfirmAppoint');
      ConfirmAppointTrans.appointment = await factory.newRelationship(namespace, 'Appointment', appointId);
      //ConfirmAppointTrans.doctor = factory.newRelationship(namespace, 'Doctor', accountNumber);
      if (check == "true") {
        ConfirmAppointTrans.access = true;
      } else if (check == "false") {
        ConfirmAppointTrans.access = false;
      }

      //submit transaction
      await businessNetworkConnection.submitTransaction(ConfirmAppointTrans);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },


  /*
    * Perform InSession transaction
    * @param {String} cardId Card id to connect to network
    * @param {String} accountNumber Account number of member
    * @param {String} partnerId Partner Id of partner
    * @param {Integer} points Points value
    */
  InSessionTrans: async function (cardId, accountNumber, appointId) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      const InSessionTrans = factory.newTransaction(NS, 'InSession');
      InSessionTrans.appointment = await factory.newRelationship(NS, 'Appointment', appointId);
      await bnc.submitTransaction(InSessionTrans);

      //submit transaction
      await businessNetworkConnection.submitTransaction(InSessionTrans);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
    * Perform Complete transaction
    * @param {String} cardId Card id to connect to network
    * @param {String} accountNumber Account number of member
    * @param {String} appintmentId ID of Appointment
    */
  CompleteTrans: async function (cardId, accountNumber, appointId) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect('admin@telehealth');

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      const CompleteTrans = factory.newTransaction(namespace, 'Complete');
      CompleteTrans.appointment = await factory.newRelationship(namespace, 'Appointment', appointId);

      //submit transaction
      await businessNetworkConnection.submitTransaction(CompleteTrans);

      //disconnect
      await businessNetworkConnection.disconnect();

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },
  /*
    * Perform addMedication transaction
    * @param {String} cardId Card id to connect to network
    * @param {String} accountNumber Account number of member
    * @param {String} appintmentId ID of Appointment
    */
  CreatePatientRecordTrans: async function (cardId, accountNumber) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      const CreatePatientRecordTrans = factory.newTransaction(namespace, 'CreatePatientRecord');
      CreatePatientRecordTrans.owner = await factory.newRelationship(namespace, 'Patient', accountNumber);

      //submit transaction
      await businessNetworkConnection.submitTransaction(CreatePatientRecordTrans);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },
  /*
    * Perform addMedication transaction
    * @param {String} cardId Card id to connect to network
    * @param {String} accountNumber Account number of member
    * @param {String} appintmentId ID of Appointment
    */
  addMedicationTrans: async function (cardId, accountNumber, appointId, symp, desc, pres) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(cardId);

      //get the factory for the business network.
      factory = businessNetworkConnection.getBusinessNetwork().getFactory();

      //create transaction
      const addMedicationTrans = factory.newTransaction(namespace, 'AddMedication');
      addMedicationTrans.appointment = await factory.newRelationship(namespace, 'Appointment', appointId);
      addMedicationTrans.symptoms = symp;
      pres = JSON.stringify(pres);
      addMedicationTrans.description = desc;
      addMedicationTrans.prescription = pres;

      //submit transaction
      await businessNetworkConnection.submitTransaction(addMedicationTrans);

      //disconnect
      await businessNetworkConnection.disconnect(cardId);

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
  * Get Patient data
  * @param {String} cardId Card id to connect to network
  * @param {String} accountNumber Account number of member
  */
  patientData: async function (cardId, accountNumber) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect('admin@telehealth');

      //get Patient from the network
      const query = businessNetworkConnection.buildQuery('SELECT org.telehealth.Patient WHERE (email == _$inputValue)');
      const patient = await businessNetworkConnection.query(query, { inputValue: accountNumber });

      //disconnect
      await businessNetworkConnection.disconnect('admin@telehealth');

      //return member object
      return patient;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error;
    }

  },

  /*
  * Get Doctor data
  * @param {String} cardId Card id to connect to network
  * @param {String} doctorId Doctor Id of doctor
  */
  doctorData: async function (cardId, accountNumber) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect('admin@telehealth');


      //get doctor from the network
      const query = businessNetworkConnection.buildQuery('SELECT org.telehealth.Doctor WHERE (email == _$inputValue)');
      const asset = await businessNetworkConnection.query(query, { inputValue: accountNumber });
      //disconnect
      //const doctorRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.Doctor');
      //const doctor = await doctorRegistry.get(doctorId);

      //disconnect
      await businessNetworkConnection.disconnect('admin@telehealth');

      //return partner object
      return asset;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }

  },

  /*
  * Get Doctor data
  * @param {String} cardId Card id to connect to network
  * @param {String} doctorId Doctor Id of doctor WHERE (doctor == _$inputValue)
  */
  docDetail: async function (card, num, id) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(card);

      //get doctor from the network
      const query = businessNetworkConnection.buildQuery('SELECT org.telehealth.Doctor WHERE (email == _$inputValue)');
      var asset = await businessNetworkConnection.query(query, { inputValue: id });
      var serializer = businessNetworkConnection.getBusinessNetwork().getSerializer();
      asset = serializer.toJSON(asset[0]);
      //disconnect
      await businessNetworkConnection.disconnect();

      //return partner object
      return asset;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }

  },
  /*
   * Get Doctor data
   * @param {String} cardId Card id to connect to network
   * @param {String} doctorId Doctor Id of doctor WHERE (doctor == _$inputValue)
   */
  patDetail: async function (card, num, id) {

    try {

      //connect to network with cardId
      businessNetworkConnection = new BusinessNetworkConnection();
      await businessNetworkConnection.connect(card);
      console.log('In Patient Detail');
      var serializer = businessNetworkConnection.getBusinessNetwork().getSerializer();
      //get doctor from the network
      const query = businessNetworkConnection.buildQuery('SELECT org.telehealth.Patient WHERE (email == _$inputValue)');
      var asset = await businessNetworkConnection.query(query, { inputValue: id });
      asset = serializer.toJSON(asset[0]);
      console.log(asset);
      //disconnect
      await businessNetworkConnection.disconnect();

      //return partner object
      return asset;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }

  },

  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  allDoctorsList: async function () {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect('admin@telehealth');

      //query all partners from the network
      var serializer = bnc.getBusinessNetwork().getSerializer();
      const query = bnc.buildQuery('SELECT org.telehealth.Doctor');
      const asset = await bnc.query(query);
      let data = [];
      var serializer = bnc.getBusinessNetwork().getSerializer();
      for(var i = 0; i < asset.length; i++){
        data.push(serializer.toJSON(asset[i]));
      }

      //disconnect
      await bnc.disconnect();

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  }
  ,

  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  patAppointments: async function (cardId, accountNumber) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect('admin@telehealth');

      var serializer = bnc.getBusinessNetwork().getSerializer();
      var val = "resource:org.telehealth.Patient#" + accountNumber;
      //get doctor from the network
      const query = bnc.buildQuery('SELECT org.telehealth.Appointment WHERE (patient == _$inputValue)');
      var assets = await bnc.query(query, { inputValue: val });
      var data = [];
      if (assets) {
        console.log(assets.length);
        for (var p = 0; p < assets.length; p++) {
          data[p] = serializer.toJSON(assets[p]);
        }
      }
      else {
        console.log('no Doctor');
      }

      //disconnect
      await bnc.disconnect();

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },


  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  conAppointments: async function (cardId, accountNumber) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect('admin@telehealth');

      var serializer = bnc.getBusinessNetwork().getSerializer();
      var val = "resource:org.telehealth.Patient#" + accountNumber;
      //get doctor from the network
      const query = bnc.buildQuery('SELECT org.telehealth.Appointment WHERE ((patient == _$inputValue) AND (status == "Appointment Confirmed"))');
      var assets = await bnc.query(query, { inputValue: val });
      var data = [];
      if (assets) {
        console.log(assets.length);
        for (var p = 0; p < assets.length; p++) {
          data[p] = serializer.toJSON(assets[p]);
        }
      }
      else {
        console.log('no Doctor');
      }

      //disconnect
      await bnc.disconnect();

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },

  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  patAppointments: async function (cardId, accountNumber) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect('admin@telehealth');

      var serializer = bnc.getBusinessNetwork().getSerializer();
      var val = "resource:org.telehealth.Patient#" + accountNumber;
      //get doctor from the network
      const query = bnc.buildQuery('SELECT org.telehealth.Appointment WHERE (patient == _$inputValue)');
      var assets = await bnc.query(query, { inputValue: val });
      var data = [];
      if (assets) {
        console.log(assets.length);
        for (var p = 0; p < assets.length; p++) {
          data[p] = serializer.toJSON(assets[p]);
        }
      }
      else {
        console.log('no Doctor');
      }

      //disconnect
      await bnc.disconnect();

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },
  /*
* Get all partners data
* @param {String} cardId Card id to connect to network
*/
  docAppointments: async function (cardId, accountNumber) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect(cardId);

      var serializer = bnc.getBusinessNetwork().getSerializer();
      var val = "resource:org.telehealth.Doctor#" + accountNumber;
      //get doctor from the network
      const query = bnc.buildQuery('SELECT org.telehealth.Appointment WHERE (doctor == _$inputValue)');
      var assets = await bnc.query(query, { inputValue: val });
      var data = [];
      if (assets) {
        console.log(assets.length);
        for (var p = 0; p < assets.length; p++) {
          data[p] = serializer.toJSON(assets[p]);
        }
      }
      else {
        console.log('no Doctor');
      }

      //disconnect
      await bnc.disconnect(cardId);

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },


  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  appointStatusDoc: async function (cardId, accountNumber, status) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect(cardId);

      var serializer = bnc.getBusinessNetwork().getSerializer();
      var val = "resource:org.telehealth.Doctor#" + accountNumber;
      //get doctor from the network
      const query = bnc.buildQuery('SELECT org.telehealth.Appointment WHERE ((doctor == _$inputValue) AND (status == _$status))');
      var assets = await bnc.query(query, { inputValue: val, status: status });
      var data = [];
      if (assets) {
        console.log(assets.length);
        for (var p = 0; p < assets.length; p++) {
          data[p] = serializer.toJSON(assets[p]);
        }
      }
      else {
        console.log('no Doctor');
      }

      //disconnect
      await bnc.disconnect();

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  }

  ,


  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  appointStatusPat: async function (cardId, accountNumber, status) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect(cardId);

      var serializer = bnc.getBusinessNetwork().getSerializer();
      var val = "resource:org.telehealth.Patient#" + accountNumber;
      //get doctor from the network
      const query = bnc.buildQuery('SELECT org.telehealth.Appointment WHERE ((patient == _$inputValue) AND (status == _$status))');
      var assets = await bnc.query(query, { inputValue: val, status: status });
      var data = [];
      if (assets) {
        console.log(assets.length);
        for (var p = 0; p < assets.length; p++) {
          data[p] = serializer.toJSON(assets[p]);
        }
      }
      else {
        console.log('no Doctor');
      }

      //disconnect
      await bnc.disconnect();

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },


  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  rmDoctorTrans: async function (cardId, accountNumber, doctorId) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect(cardId);

      //get the factory for the business network.
      factory = bnc.getBusinessNetwork().getFactory();
      console.log(cardId);
      console.log(accountNumber);
      console.log(doctorId);
      //create transaction
      const rmDoctorTrans = factory.newTransaction(namespace, 'rmDoctor');
      rmDoctorTrans.doctor = factory.newRelationship(namespace, 'Doctor', doctorId);
      rmDoctorTrans.patient = factory.newRelationship(namespace, 'Patient', accountNumber);
      console.log('caliing');
      //submit transaction
      await bnc.submitTransaction(rmDoctorTrans);
      console.log('calling');

      //disconnect
      await bnc.disconnect(cardId);

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  }
  ,
  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  addDoctorTrans: async function (cardId, accountNumber, doctorId) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect(cardId);

      //get the factory for the business network.
      factory = bnc.getBusinessNetwork().getFactory();
      console.log(cardId);
      console.log(accountNumber);
      console.log(doctorId);
      //create transaction
      const addDoctorTrans = factory.newTransaction(namespace, 'addDoctor');
      addDoctorTrans.doctor = factory.newRelationship(namespace, 'Doctor', doctorId);
      addDoctorTrans.patient = factory.newRelationship(namespace, 'Patient', accountNumber);

      //submit transaction
      await bnc.submitTransaction(addDoctorTrans);

      //disconnect
      await bnc.disconnect(cardId);

      return true;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  }
  ,


  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  getPatientRecords: async function (cardId, accountNumber) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect(cardId);
      //get the factory for the business network.
      factory = bnc.getBusinessNetwork().getFactory();
      //add member participant
      let participantRegistry = await bnc.getParticipantRegistry(namespace + '.Patient');
      let patient = await participantRegistry.get(accountNumber);
      let rId = patient.patientRecord;
      participantRegistry = await bnc.getAssetRegistry(namespace + '.PatientRecord');
      let record = await participantRegistry.get(rId.$identifier);
      //query all partners from the network
      var serializer = bnc.getBusinessNetwork().getSerializer();
      record = serializer.toJSON(record);

      //disconnect
      await bnc.disconnect(cardId);
      console.log(record);
      return record;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },
  /*
  * Get all partners data
  * @param {String} cardId Card id to connect to network
  */
  queryRecord: async function (cardId) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      let data = new Object;
      data.recordArray = [];
      data.patArray = [];
      try {
        await bnc.connect(cardId);
      } catch (error) {
        console.log("hi-----------------catach------------- -------------" );
        return data;
      }
     

      var serializer = bnc.getBusinessNetwork().getSerializer();
      //get doctor from the network
      const query = bnc.buildQuery('SELECT org.telehealth.PatientRecord');
      var assets = await bnc.query(query);
     
      console.log("hi------------------------------ -------------" + assets);
      if (assets) {
        console.log(assets.length);
        for (var p = 0; p < assets.length; p++) {
          data.recordArray[p] = serializer.toJSON(assets[p]);
          //add member participant
          let participantRegistry = await bnc.getParticipantRegistry(namespace + '.Patient');
          // let patient = ;
          data.patArray[p] = serializer.toJSON(await participantRegistry.get(data.recordArray[p].owner.split("#")[1]))
          console.log("hi------------------------------ -------------" +data.patArray[p]);
        }
        if(data.patArray == null){
          data.patArray =[];
        }
      }
      else {
        console.log('no Doctor');
      }

      //disconnect
      await bnc.disconnect();

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },
  /*
    * Get all partners data
    * @param {String} cardId Card id to connect to network
    */
  getPatientRecord: async function (cardId, recordId) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect(cardId);
      //get the factory for the business network.
      factory = bnc.getBusinessNetwork().getFactory();
      participantRegistry = await bnc.getAssetRegistry(namespace + '.PatientRecord');
      let record = await participantRegistry.get(recordId);
      //query all partners from the network
      var serializer = bnc.getBusinessNetwork().getSerializer();
      record = serializer.toJSON(record);

      //disconnect
      await bnc.disconnect(cardId);
      console.log(record);
      return record;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  },
    /*
* Get all partners data
* @param {String} cardId Card id to connect to network
*/
queryDoctor: async function (term) {

    try {
      //connect to network with cardId
      //connect as admin
      const bnc = new BusinessNetworkConnection();
      await bnc.connect('admin@telehealth');

      //get doctor from the network
      const query = bnc.buildQuery('SELECT org.telehealth.Doctor WHERE (speciality == _$inputValue)');
      let asset = await bnc.query(query, { inputValue: term });
      let data = [];
      var serializer = bnc.getBusinessNetwork().getSerializer();
      for(var i = 0; i < asset.length; i++){
        data.push(serializer.toJSON(asset[i]));
      }

      //disconnect
      await bnc.disconnect();

      //return allPartners object
      return data;
    }
    catch (err) {
      //print and return error
      console.log(err);
      var error = {};
      error.error = err.message;
      return error
    }
  }
}
