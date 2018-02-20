import * as functions from 'firebase-functions';
import * as moment from 'moment';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
 

const functions = require('firebase-functions')
const admin = require('firebase-admin')



admin.initializeApp(functions.config().firebase);
const formattedDate = moment().format("YYYYMMDD");
const stripe = require('stripe')(functions.config().stripe.testkey)

// export const helloWorld = functions.https.onRequest((request, res) => {

  //  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    // Request methods you wish to allow
  //  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
  //  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
  //  res.setHeader('Access-Control-Allow-Credentials', true);
  //  const data  = request.data;

 //const test = 'Ceci est un test';
// res.send("Hello from Firebase!", request);
 // return  test ;
  //  response.status(200).send(formattedDate);
 //  });

 export interface User {
    uid: string;
    email?: string;
    photoURL?: string;
    displayName?: string;
    favoriteColor?: string;
    membre?: object;
  }

exports.test3 = functions.firestore
                                .document('/users/{userEmail}/numerosFac/{numberId}')
                                .onWrite( event => {
                                    const payment = event.data.data();
                                    const userEmail = event.params.userEmail;
                                    const numberId = event.params.numberId;    
                                    const dateNow = Date.now();
                                    const oneYr = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
                                    let membre: object;
                                    let temp: Array<string>;
                                    const docRef = admin.firestore().collection('users').doc(userEmail)

                                    if (!payment || payment.charge) return;
                                    docRef
                                    .get()
                                    .then(snapshot => {
                                        let isFirst: boolean;
                                        isFirst = true;
                                        temp = Object.getOwnPropertyNames(snapshot.data()['membre']);
                                        temp.forEach( x => {
                                            if( x === 'adhDate') {
                                                isFirst = false
                                            }
                                        });
                                        membre = snapshot.data()['membre'];
                                        if (isFirst) {
                                           
                                            membre['adhDate'] = moment(dateNow).add(1, 'years').format('YYYYMMDD');
                                            console.log('dateNow',moment(dateNow).format(), 'dateYear', moment(oneYr).format())
                                        } else {
                                            const temp2 = membre['adhDate'];
                                            console.log('temp2', temp2,'autredateNow',moment(dateNow).format(), 'dateYear', moment(oneYr).format())
                                            if(moment(temp2).isBefore(moment(dateNow).format('YYYYMMDD'))) {
                                                membre['adhDate'] = moment(dateNow).add(1, 'years').format('YYYYMMDD');
                                            } else {
                                                membre['adhDate'] = moment(temp2).add(1, 'years').format('YYYYMMDD')
                                            }
                                        }

                                        console.log('snapshot' , snapshot.data()['membre'], membre );
                                        return snapshot.data();
                                     })
                                     .then(customer => {
                      
                                       const amount = payment.amount;
                                       const idempotency_key = numberId;  // prevent duplicate charges
                                       const source = payment.token.id;
                                       const currency = 'usd';
                                       const charge = {amount, currency, source};
                      
                      
                                       return stripe.charges.create(charge, { idempotency_key });
                      
                                     })
                                     .then(charge => {
                                        docRef.collection('numerosFac').doc(numberId)
                                             .set(charge);
                                             return docRef;
                                       })
                                       .then(configDate => {
                                        configDate.update({membre}); 
                                     })
                                   
                                });
 // const payment = event.data.data();
 // const userEmail = event.params.userEmail;
 // const paymentId = event.params.paymentId;

  // checks if payment exists or if it has already been charged
   
        //        event.data.ref.set({id: 1, montant: 100, type: 'insc' , item: [{isnc: 'Ceci est un test'}]});
            










exports.stripeCharge = functions.database
                                .ref('/payments/{userId}/{paymentId}')
                                .onWrite(event => {
  const payment = event.data.val();
  const userId = event.params.userId;
  const paymentId = event.params.paymentId;
  

  // checks if payment exists or if it has already been charged
  if (!payment || payment.charge) return;

  return admin.database()
              .ref(`/users/${userId}`)
              .once('value')
              .then(snapshot => {
                  return snapshot.val();
               })
               .then(customer => {

                 const amount = payment.amount;
                 const idempotency_key = paymentId;  // prevent duplicate charges
                 const source = payment.token.id;
                 const currency = 'usd';
                 const charge = {amount, currency, source};


                 return stripe.charges.create(charge, { idempotency_key });

               })

               .then(charge => {
                   admin.database()
                        .ref(`/payments/${userId}/${paymentId}/charge`)
                        .set(charge)
                  })


});
