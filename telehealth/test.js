'use strict';
const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const NetworkPing = require('composer-cli').Network.Ping;
const bnc = new BusinessNetworkConnection();
const NS = 'org.telehealth';
console.log('hi');
/**
 * a completed appointment by doctor
 * @param {org.telehealth.network.Complete} tx - the appointment to be processed
 * @transaction
 */
async function allDoctor() {
    let check = await bnc.connect('admin@telehealth');
    if (check) {
        console.log('connected using admin');
    }
    else {
        console.log('Failed to connect');
    }
    // Build a query.const connection = new BusinessNetworkConnection();
    // Get the serializer.
    var serializer = bnc.getBusinessNetwork().getSerializer();
    const query = bnc.buildQuery('SELECT org.telehealth.Doctor');
    const assets = await bnc.query(query);
    if (assets) {
        console.log('Participants Docotor' + JSON.stringify(assets));
        /*console.log('Rating ' + JSON.stringify(serializer.toJSON(assets[0]).rating));
        console.log('Speciality ' + JSON.stringify(serializer.toJSON(assets[0]).speciality));
        let now = new Date(Date.now()).toLocaleString();
        console.log(now.getDate());
        let timeDifference = Math.abs(now.getDate() - new Date(serializer.toJSON(assets[0]).experience).getDate());
        console.log('Working Since ' + new Date(serializer.toJSON(assets[0]).experience));
        console.log('Email ' + JSON.stringify(serializer.toJSON(assets[0]).email));
        console.log('Name ' + JSON.stringify(serializer.toJSON(assets[0]).fName));*/
    }
    else {
        console.log('no Doctor');
    }

}
//allDoctor();

/**
 * a completed appointment by doctor
 * @param {org.telehealth.network.Complete} tx - the appointment to be processed
 * @transaction
 */
async function getDoctor() {
    await bnc.connect('admin@telehealth');
    // Build a query.const connection = new BusinessNetworkConnection();
    // Get the serializer.
    var serializer = bnc.getBusinessNetwork().getSerializer();
    const query = bnc.buildQuery('SELECT org.telehealth.Appointment)');
    const assets = await bnc.query(query);

    console.log('Appointment for Pateint ID ' + JSON.stringify(serializer.toJSON(assets[0])));
    /*console.log('Rating ' + JSON.stringify(serializer.toJSON(assets[0]).rating));
    console.log('Speciality ' + JSON.stringify(serializer.toJSON(assets[0]).speciality));
    console.log('Working Since ' + new Date(serializer.toJSON(assets[0]).experience));
    console.log('Email ' + JSON.stringify(serializer.toJSON(assets[0]).email));
    console.log('Name ' + JSON.stringify(serializer.toJSON(assets[0]).fName));
    */
}
//getDoctor();

/**
* Get Doctor data
* @param {String} cardId Card id to connect to network
* @param {String} doctorId Doctor Id of doctor
*/
async function doctorData(cardId, accountNumber) {

    try {

        //connect to network with cardId
        await bnc.connect('admin@telehealth');

        var serializer = bnc.getBusinessNetwork().getSerializer();
        const query = bnc.buildQuery('SELECT org.telehealth.Doctor WHERE (personId == _$inputValue)');
        const assets = await bnc.query(query, { inputValue: accountNumber });
        //disconnect
        await bnc.disconnect('admin@telehealth');
        if(assets.length > 0 ){
            console.log(assets);
        }
        //return partner object
        console.log(assets);
    }
    catch (err) {
        //print and return error
        console.log(err);
        var error = {};
        error.error = err.message;
        return error;
    }
}
doctorData('asd','123123');