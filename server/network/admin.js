'use strict';
const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const IdentityRevoke = require('composer-cli').Identity.Revoke;


//declate namespace
const namespace = 'org.telehealth';
//export module
module.exports = {

    identityList: async function (card, type) {
        let businessNetworkConnection = new BusinessNetworkConnection();
        try {
            await businessNetworkConnection.connect(card);
            let identityRegistry = await businessNetworkConnection.getIdentityRegistry();
            let identities = await identityRegistry.getAll();
            let data =[];
            identities.forEach((identity) => {
            if(identity.participant.$type === type){
                data.push(identity);
            }
            });
            
            await businessNetworkConnection.disconnect();
            return data;
        } catch(error) {
            console.log('-----------------------------------------------------------------'+error);
            //process.exit(1);
        }
    },
    revokeId: async function (card, id) {
        let businessNetworkConnection = new BusinessNetworkConnection();

        try {
            await businessNetworkConnection.connect(card);
            await businessNetworkConnection.revokeIdentity(id)
            console.log('revoked');
            await businessNetworkConnection.disconnect();
        } catch(error) {
            console.log(error);
            //process.exit(1);
        } 
        return true; 
    },
    /*
    * Get all UsePoints transactions data
    * @param {String} cardId Card id to connect to network
    */
   RequestAppointTransInfo: async function (cardId) {
  
      try {
        //connect to network with cardId
        let businessNetworkConnection = new BusinessNetworkConnection();
        await businessNetworkConnection.connect(cardId);
  
        const query = businessNetworkConnection.buildQuery('SELECT org.telehealth.RequestAppoint');
        const RequestAppoint = await businessNetworkConnection.query(query);
        var serializer = businessNetworkConnection.getBusinessNetwork().getSerializer();
        let data = [];
        for(var i = 0; i < RequestAppoint.length; i++){
            data.push(serializer.toJSON(RequestAppoint[i]));
        }
        //disconnect
        await businessNetworkConnection.disconnect(cardId);
  
        //return usePointsResults object
        return data;
      }
      catch(err) {
        //print and return error
        console.log(err);
        var error = {};
        error.error = err.message;
        return error
      }
  
    },
    /*
    * Get all UsePoints transactions data
    * @param {String} cardId Card id to connect to network
    */
   PatientRecords: async function (cardId) {
  
      try {
        //connect to network with cardId
        let businessNetworkConnection = new BusinessNetworkConnection();
        await businessNetworkConnection.connect(cardId);
  
        const query = businessNetworkConnection.buildQuery('SELECT org.telehealth.PatientRecord');
        const RequestAppoint = await businessNetworkConnection.query(query);
        var serializer = businessNetworkConnection.getBusinessNetwork().getSerializer();
        let data = [];
        for(var i = 0; i < RequestAppoint.length; i++){
            data.push(serializer.toJSON(RequestAppoint[i]));
            console.log(data[i]);
        }
        //disconnect
        await businessNetworkConnection.disconnect(cardId);
  
        //return usePointsResults object
        return data;
      }
      catch(err) {
        //print and return error
        console.log(err);
        var error = {};
        error.error = err.message;
        return error
      }
  
    }
}