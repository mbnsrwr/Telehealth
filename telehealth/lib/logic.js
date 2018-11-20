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
 * Write your transction processor functions here
 */
function uuid() {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

var appointStatus = {
    Created: { code: 1, text: 'Appointment Created' },
    Confirmed: { code: 2, text: 'Appointment Confirmed' },
    Completed: { code: 3, text: 'Appointment Completed' },
    Cancelled: { code: 4, text: 'Appointment Cancelled' }
};

var ns = 'org.telehealth';

/**
 * Request an appointment from Doctor
 * @param {org.telehealth.CreatePatientRecord} tx
 * @transaction
 */
async function CreatePatientRecord(tx) {
    let id = uuid();
    var factory = getFactory();
    let patientRecord = factory.newResource(ns, 'PatientRecord', id);
    patientRecord.owner = tx.owner;
    patientRecord.medications = [];
    patientRecord.myDoctors = [];
    let patientRecordRegisrty = await getAssetRegistry(ns + '.PatientRecord');
    await patientRecordRegisrty.add(patientRecord);
    let patRegisrty = await getParticipantRegistry(ns + '.Patient');
    patientRecord.owner.patientRecord = patientRecord;
    await patRegisrty.update(patientRecord.owner);
}

/**
 * Request an appointment from Doctor
 * @param {org.telehealth.addDoctor} tx
 * @transaction
 */
async function addDoctor(tx) {
    let a = false;
    tx.patient.patientRecord.myDoctors.some(function (doctor) {
        if (doctor.getIdentifier() === tx.doctor.getIdentifier()) {
            a = true;
        }
    });
    if(!a){
        tx.patient.patientRecord.myDoctors.push(tx.doctor);
        let patientRecordREG = await getAssetRegistry(ns + '.PatientRecord');
        await patientRecordREG.update(tx.patient.patientRecord);
    }
}

/**
 * Request an appointment from Doctor
 * @param {org.telehealth.rmDoctor} tx
 * @transaction
 */
async function rmDoctor(tx) {
    let dRay = tx.patient.patientRecord.myDoctors;
    console.log(typeof(dRay));
    let index = dRay.map(x => {
        return x.email;
    }).indexOf(tx.doctor.email);
    dRay.splice(index, 1);
    let patientRecordREG = await getAssetRegistry(ns + '.PatientRecord');
    await patientRecordREG.update(tx.patient.patientRecord);
}

/**
 * Request an appointment from Doctor
 * @param {org.telehealth.Review} tx
 * @transaction
 */
async function Review(tx) {
    if (tx.appointment.status === appointStatus.Confirmed.text) {
        tx.appointment.review = tx.review;
        tx.appointment.rate = tx.rate;
        let appointRegisrty = await getAssetRegistry(ns + '.Appointment');
        await appointRegisrty.update(tx.appointment);
    }
}

/**
 * Request an appointment from Doctor
 * @param {org.telehealth.RequestAppoint} tx
 * @transaction
 */
async function RequestAppoint(tx) {
    let id = uuid();
    console.log(id);
    var factory = getFactory();
    let appointment = factory.newResource(ns, 'Appointment', id);
    appointment.time = tx.time;
    appointment.date = tx.date;
    appointment.created = new Date().toISOString();
    appointment.patient = tx.patient;
    appointment.doctor = tx.doctor;
    appointment.status = appointStatus.Created.text;
    let appointRegisrty = await getAssetRegistry(ns + '.Appointment');
    await appointRegisrty.add(appointment);
    let patRegisrty = await getParticipantRegistry(ns + '.Patient');
    let patient = tx.patient;
    if (patient.appointments) {
        patient.appointments.push(appointment);
    }
    else {
        patient.appointments = [appointment];
    }
    if (patient.myDoctors) {
        patient.myDoctors.push(tx.doctor);
    }
    else {
        patient.myDoctors = [tx.doctor];
    }
    await patRegisrty.update(patient);

}



/**
 * a request to cancel an appoimtment
 * @param {org.telehealth.CancelAppoint} tx - the order to be processed
 * @transaction
 */
async function CancelAppoint(tx) {
    if ((tx.appointment.status === appointStatus.Created.text)) {
        tx.appointment.status = appointStatus.Cancelled.text;
        tx.appointment.canceled = new Date().toISOString();
        let appointRegisrty = await getAssetRegistry(ns + '.Appointment');
        await appointRegisrty.update(tx.appointment);
        let docRegisrty = await getParticipantRegistry(ns + '.Doctor');
        let doctor = tx.appointment.doctor;
        if (doctor.appointments) {
            doctor.appointments.push(tx.appointment);
        }
        else {
            doctor.appointments = [tx.appointment];
        }
        await docRegisrty.update(doctor);
    }
}



/**
 * a request to Confirm an appoimtment
 * @param {org.telehealth.ConfirmAppoint} tx - the order to be processed
 * @transaction
 */
async function ConfirmAppoint(tx) {
    console.log(tx.appointment.status);
    if (tx.appointment.status === appointStatus.Created.text) {
        tx.appointment.status = appointStatus.Confirmed.text;
        tx.appointment.Access = tx.access;
        tx.appointment.confirmed = new Date().toISOString();
        let appointRegisrty = await getAssetRegistry(ns + '.Appointment');
        await appointRegisrty.update(tx.appointment);
        let docRegisrty = await getParticipantRegistry(ns + '.Doctor');
        let doctor = tx.appointment.doctor;
        if (doctor.appointments) {
            doctor.appointments.push(tx.appointment);
        }
        else {
            doctor.appointments = [tx.appointment];
        }
        await docRegisrty.update(doctor);
    }
}


/**
 * a completed appointment by doctor
 * @param {org.telehealth.Complete} tx - the appointment to be processed
 * @transaction
 */
async function Complete(tx) {
    if (tx.appointment.status === appointStatus.Confirmed.text) {
        tx.appointment.completed = new Date().toISOString();
        tx.appointment.status = appointStatus.Completed.text;
        let appointRegisrty = await getAssetRegistry(ns + '.Appointment');
        await appointRegisrty.update(tx.appointment);
    }
}

/**
  * to prescribe a medication
  * @param {org.telehealth.AddMedication} CreateMedication prescription instance
  * @transaction
*/
async function AddMedication(tx) { //add condition if appointment is CONFIRMED only then add
    let medId = uuid();
    var factory = getFactory();
    let medication = factory.newConcept(ns, 'Medication');
    medication.appointment = tx.appointment;
    medication.created = new Date().toISOString();
    medication.symptoms = tx.symptoms;
    medication.description = tx.description;
    medication.medicines = [];
    medication.dosage = [];
    medication.notes = [];
    const pres = JSON.parse(tx.prescription);
    for (var i = 0; i < pres.length; i++) {
        medication.medicines[i] = pres[i].med;
        medication.dosage[i] = pres[i].dosage;
        medication.notes[i] = pres[i].note;
    }
    tx.appointment.patient.patientRecord.medications.push(medication);
    let patRegisrty = await getAssetRegistry(ns + '.PatientRecord');
    await patRegisrty.update(tx.appointment.patient.patientRecord);
}
