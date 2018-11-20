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
* Request an appointment from Doctor
* @param {org.telehealth.network.RequestAppoint} tx
* @transaction
*/
function createDoctor(NS, factory, id) {
    const doc = factory.newResource(NS, 'Doctor', id);
    doc.name = 'Some Doctor for testing';
    //doc.rating = 5;
    doc.speciality = 'General';
    doc.email = 'doctor@net.com';
    doc.experience = new Date('2018-01-02T11:42Z');
    return doc;
}

/**
 * Request an appointment from Doctor
 * @param {NS} NS
 * @param {factory} factory
 * @param {id} id
 * @returns {patient}
 * @transaction
 */
function createPatient(NS, factory, id) {
    const patient = factory.newResource(NS, 'Patient', id);
    patient.name = 'Some patient name';
    //patient.balance = 12.0;
    return patient;
}

/**
 * Request an appointment from Doctor
 * @param {org.telehealth.network.RequestAppoint} tx
 * @transaction
 */
function createAppointment(NS, factory, id, doctor, patient) {
    const appoint = factory.newResource(NS, 'Appointment', id);

    appoint.doctor = factory.newRelationship(NS, 'Doctor', doctor.$identifier);
    appoint.patient = factory.newRelationship(NS, 'Patient', patient.$identifier);
    //appoint.duration = 15.3;
    return appoint;
}

module.exports = {
    createDoctor,
    createPatient,
    createAppointment,
};
