import * as functions from 'firebase-functions';
import * as moment from 'moment';
import { Timer } from 'moment-timer'
import { firestore } from 'firebase-admin';


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
// firebase functions:config:set stripe.testkey="YOUR_STRIPE_TEST_KEY"
// firebase functions:config:get

 
const nodemailer = require('nodemailer')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const bodyParser = require('body-parser').raw({type: '*/*'});
const endpointSecret = 'whsec_blSjcGhK1UHRbyGwXa9wSaK9FzLErNIS';


admin.initializeApp(functions.config().firebase);
const fs = require('fs-extra');
const gcs = require('@google-cloud/storage')();
const path = require('path');
const os = require('os');
const json2csv = require('json2csv').parse;
const formattedDate = moment().format("YYYYMMDD");
const stripe = require('stripe')(functions.config().stripe.testkey);
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});


export const stripeWebhooks = functions.https.onRequest((req, res) => {
    let body = [];
    const data = req.body.data;
    const userEmail = req.body.data.object['source'].name;
    const status = req.body.data.object['status'];
   // const docRef = admin.firestore().collection('users').doc(userEmail);
    
    // const event_json = bodyParser(req.body);
    console.log('allo--' ,data, userEmail); 
    req.on('data', (chunk) => {
      body.push(chunk);
      console.log('--allo' , body);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      console.log('allo++' , body);
      res.send("Hello from Firebase!", req);
      res.end(body);
    });
    req.on('error', (err) => {
        // This prints the error message and stack trace to `stderr`.
        console.error(err.stack);
      });
   // res.send("Hello from Firebase!", req);
  // const event_json = JSON.parse(req.body);
   // const event_json = JSON.parse(req.body);
   // console.log(req);
    // try {
    //     let event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    //     // Do something with event
    //     console.log('event' , event);
    //   }
    //   catch (err) {
    //     res.status(400).end()
    //   }
    
      // Return a response
    //  res.json({received: true});
    
      res.send(200);
    });
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




 exports.createCSV = functions.firestore
 .document('reports/{reportId}')
 .onCreate(event => {
    const fields = ['id']
    const fields3 = ['data','date','downLoadPath','numero','path','volume'];
     // Step 1. Set main variables
     const fields2 = ['displayName', 'email',
     'membre.adhDate',
     'membre.infFacturation',
     'membre.estMembreActif',
     'membre.email',
     'membre.nom',
     'membre.prenom',
     'membre.adresse',  // Référence à une autre interface
     'membre.ville',
     'membre.codePostal',
     'membre.province',
     'membre.telephone',
     'membre.profession',
     'membre.dateNaissance',
     'membre.typeCotisation',
     'membre.courrielConjouint',
     'membre.teleList',
     'membre.nomListe',
     'membre.animExc',
     'membre.recenNoel',
     'membre.animKio',
     'membre.consAdm',
     'membre.redacRevi',
     'membre.promoPubli',
     'membre.autre', 'photoURL','uid']
     const _json2csv = new json2csv({ fields });
     const reportId = event.params.reportId;
     const fileName = `reports/${reportId}.csv`;
     const tempFilePath = path.join(os.tmpdir(), fileName);
     
     // Reference report in Firestore
     const db = admin.firestore()
     const reportRef = db.collection('reports').doc(reportId)

     // Reference Storage Bucket
     const storage = gcs.bucket('coov3-f509c.appspot.com')


     // Step 2. Query collection
     return db.collection('ornitaouais')
              .get() 
              .then(querySnapshot => {
                 
                 /// Step 3. Creates CSV file from with orders collection
                 const users = []

                 // create array of order data
                 querySnapshot.forEach(doc => {
                     users.push( doc.data() )
                 }); 
                 console.log('users' , users);
                 const _csv = json2csv({data:users});   
                 console.log('users' , _csv);
                 return _csv;
              }).catch(err => console.log('users' , err) )
             .then(csv => {
                 // Step 4. Write the file to cloud function tmp storage
                 return fs.outputFile(tempFilePath, csv);
             })
             .then(() => {
                console.log('storage', storage);
                 // Step 5. Upload the file to Firebase cloud storage
                 return storage.upload(tempFilePath, { destination: fileName })
             })
             .then(file => {
                 // Step 6. Update status to complete in Firestore 
                    console.log('file', file);
                 return reportRef.update({ status: 'complete' })
             })
             .catch(err => console.log(err) )

})
  

  exports.sendEmailConfirmation3 = functions.firestore
  .document('/users/{userEmail}/emails/{emailId}').onWrite((event) => {
    const snapshot = event.data;
    const val = snapshot.data();
    
     
 //   const adhesion = snapshot.data()['membre'];
  //  if (!snapshot.changed('adhDate')) {
   //     return null;
   //   }
  let mailOptions: object;
  switch(val.type) {
    case 'firstAdhesion':
      const infoFactFirst = val.infoFact;
      const noFactureFirst = infoFactFirst['numberFac'];
      const montantFirst = infoFactFirst['montant'];
      mailOptions = {
            from: '"Le Club des ornithologues de l\'Outaouais" <cooutaouais@gmail.com>',
            to: val.to,
            subject: 'CLUB DES ORNITHOLOGUES DE L\'OUTAOUAIS',
            text: '',
            html:
            `<!DOCTYPE html>
            <html lang="fr">
              <head>
                <title>Making Accessible Emails</title>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <style type="text/css">
                    /* CLIENT-SPECIFIC STYLES */
                    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { -ms-interpolation-mode: bicubic; }
            
                    /* RESET STYLES */
                    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                    table { border-collapse: collapse !important; }
                    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
                </style>
              </head>
              <body style="background-color: black; margin: 0 !important; padding: 60px 0 60px 0 !important;">
                <table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%">
                  <tr>  
                      <td bgcolor="black" style="font-size: 0;">&​nbsp;</td>
                      <td bgcolor="black" width="600" style="border-radius: 4px; color: grey; font-family: sans-serif; font-size: 18px; line-height: 28px; padding: 40px 40px;">
                        <article>
                          <h1 style="color: white; font-size: 32px; font-weight: bold; line-height: 36px; margin: 0 0 30px 0; text-align: center;">Club des ornithologues de l’Outaouais (COO)</h1>
                          <img alt="" src="https://firebasestorage.googleapis.com/v0/b/coov3-f509c.appspot.com/o/picEmail.png?alt=media&token=03f45c89-a227-47c7-9f92-962f830ec210" height="300" width="600" style="background-color: black; color: #f8c433; display: block; font-family: sans-serif; font-size: 72px; font-weight: bold; height: auto; max-width: 100%; text-align: center; width: 100%;">
                        <!-- Photo by Josh Nuttall on Unsplash -->
                          <p style="margin: 30px 0 30px 0;">Votre transaction a été autorisée et votre numéro de facture est : <span style="color: #C51162;">${noFactureFirst}</span>.</p>
                          <p style="margin: 30px 0 30px 0;">Merci d’avoir adhéré au Club des ornithologues de l’Outaouais (COO). C’est avec plaisir que nous vous accueillons!</p>
                          <pstyle="margin: 30px 0 30px 0;">Votre adhésion au COO vous permet de participer aux nombreuses activités du Club qui sont organisées tout au long de l’année et vous donne accès au format numérique du journal du Club, <span style="font-style: italic;">L’Ornitaouais</span>, publié quatre fois par année.  Cliquer ici pour obtenir la dernière édition :</p>
                          <p style="margin: 30px 0 30px 0; text-align: center;">
                            <a href="https://grandpic.org" target="_blank" style="font-size: 18px; font-family: sans-serif; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px; -webkit-border-radius: 8px; background-color: #C51162; border-top: 20px solid #C51162; border-bottom: 18px solid #C51162; border-right: 40px solid #C51162; border-left: 40px solid #C51162; display: inline-block;">Accéder au GrandPic.org</a>
                          </p>
                          <p>
                            Si vous avez payé (10$)  pour recevoir la version papier, vous recevrez votre première copie de la prochaine édition.</p>
                          <br>
                          <p style="margin: 0 0 30px 0;">Afin de vous permettre de mieux apprécier votre participation au COO, nous vous invitons à lire le <a href="http://www.coo.qc.ca/coo/CodeEthique.php">Code de conduite</a> à adopter lors de vos sorties d’observations.</p>
                          <br>
                          <p style="margin: 0 0 30px 0;">Visitez le site Web pour consulter le programme des activités en cours au www.coo.ca <a href="http://www.coo.qc.ca/">www.coo.qc.ca</a>.</p>
                        </article>
                      </td>
                      <td bgcolor="black" style="font-size: 0;">&​nbsp;</td>
                  </tr>
                </table>
              </body>
            </html>`
      }
    break;

      case 'adhesion':
      const infoFact = val.infoFact;
      const noFacture = infoFact['numberFac'];
      const montant = infoFact['montant'];
      mailOptions = {
            from: '"Le Club des ornithologues de l\'Outaouais" <cooutaouais@outlook.com>',
            to: val.to,
            subject: 'CLUB DES ORNITHOLOGUES DES L\'OUTAOUAIS',
            text: '',
            html:`<h1> Le Club des ornithologues de l’Outaouais (COO) </h1>
            <p>vous remercie d’avoir renouvelé votre adhésion. </p>
            <p>Consultez régulièrement le site Web du COO pour connaître les activités, les changements au programme des activités et toutes autres nouvelles d’intérêt pour les ornithologues amateurs de l’Outaouais :</p><a href="www.coo.qc.ca"> www.coo.qc.ca</a>
            <br><br><h3>Votre numéron de facture est ${noFacture}</h3><br><h3>Le montant de la facture est de :\$${montant/100}.00</h3>`

      }
      break;
      case 'communication':
      mailOptions = {
        from: `"Un membre COO" <${val.from}>`,
        to: val.to,
        subject: 'Un membre du COO vous envoie un message',
        text: '',
        html:`<p>Le membre ${val.from} vous envoie ce message:</p><br><br><p>${val.texte}</p>`
  }
      break;
      case 'avisRenouvellement':
      mailOptions = {
        from: `"Le Club des ornithologues de l\'Outaouais" <${val.from}>`,
        to: val.to,
        subject: 'Avis de renouvellement ',
        text: '',
        html:`<br><br>
        <p>Votre adhésion au Club des ornithologues de l’Outaouais (COO) arrivera bientôt à échéance. Nous espérons que vous appréciez votre participation au COO et nous vous invitons à renouveler votre adhésion en utilisant le système en ligne<a href="https://grandpic.org">GrandPic</a> sur le site Web du COO. </p>
        `
        
  }
  console.log('from:',val.from);
  break;

  case 'avisRenouvellement2':
      mailOptions = {
        from: `"Le Club des ornithologues de l\'Outaouais" <${val.from}>`,
        to: val.to,
        subject: 'Avis de renouvellement ',
        text: '',
        html:`<br><br>
        <p>Votre adhésion au Club des ornithologues de l’Outaouais (COO) est arrivée à échéance. Nous espérons sincèrement que vous continuerez à faire partie de nos rangs.  Nous vous invitons à renouveler votre adhésion en utilisant le système en ligne <a href="https://grandpic.org">GrandPic</a> sur le site Web du COO. </p>
        `
        
  }
  console.log('from:',val.from);
  break;
  case 'avisRenouvellement3':
      mailOptions = {
        from: `"Le Club des ornithologues de l\'Outaouais" <${val.from}>`,
        to: val.to,
        subject: 'Avis de renouvellement ',
        text: '',
        html:`<br><br>
        <p>Votre adhésion au Club des ornithologues de l’Outaouais (COO) est échue.  Si vous souhaitez maintenir votre accès au journal du Club, vous devrez renouveler votre adhésion en utilisant le système en ligne<a href="https://grandpic.org">GrandPic</a> sur le site Web du COO. Si vous nous quittez, nous espérons que vous aurez apprécié votre passage au COO et nous vous souhaitons de belles observations. </p>
        `
        
  }
  console.log('from:',val.from);
  break;
}
   // const mailOptions = {
  //    from: '"Le club des Ornithologues de l\'Outaouais" <cooutaouais@outlook.com>',
  //    to: val.to,
  //    subject: 'Thanks and Welcome!',
  //    test: 'Thanks you for subscribing to our newsletter.'
//    };
  
    const subscribed = val.estMembreActif;
  
    // Building Email message.
    
    return mailTransport.sendMail(mailOptions)
      .then(() => console.log(`New ${subscribed ? '' : 'un'}subscription confirmation email sent to:`, val.email))
      .catch((error) => console.error('There was an error while sending the email:', error));
  });


exports.stripeAdhesion = functions.firestore
                                .document('/users/{userEmail}/numerosFac/{numberId}')
                                .onWrite( event => {
                                    const payment = event.data.data();
                                    const userEmail = event.params.userEmail;
                                    const numberId = event.params.numberId;    
                                    const dateNow = Date.now();
                                    const oneYr = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
                                    let noFacture: number;
                                    let noEmail: number;
                                    let membre: object;
                                    let isFirstAdhesion: boolean;                                 
                                    let infoFact: object;
                                    let DatePourConjouint: number;
                                    const docRef = admin.firestore().collection('users').doc(userEmail);
                                    const infRef = admin.firestore().collection('informations').doc('numerotation');
                                    
                                    console.log('payment',payment.token ? "true" : "false");
                                    if (!payment || payment.charge) { 
                                        // doit effacer la derniere facture dans infFacturation
                                        console.log('Testpayment',payment, payment.charge);
                                        docRef.get().then( x => {
                                            membre = x.data()['membre']; 
                                            membre['infFacturation'].pop();
                                            docRef.update({membre});
                                            console.log('membrePop' , membre)
                                        })
                                        return;
                                    } else {
                                            if(payment.token){
                                    infRef.get().then( x => {
                                        const noFac = x.data()['noFacture'];
                                        const noEmai = x.data()['noEmail'];
                                        noFacture = noFac;
                                        noEmail = noEmai+1; 
                                        infRef.update({noEmail,noFacture});
                                        return infRef;
                                    }).catch((error) => console.error('Ceci à cosé un problème infoRef:','email', noEmail, error ))
                                    .then( z => {
                                    docRef
                                    .get()
                                    .then(snapshot => {
                                      
                                        membre = snapshot.data()['membre'];
                                        const tabFact = membre['infFacturation'];
                                        if (membre['adhDate'] === 0) {
                                            membre['adhDate'] = moment(dateNow).add(1, 'years').format('YYYYMMDD');
                                            isFirstAdhesion = true; 
                                        }else {
                                            isFirstAdhesion = false; 
                                            const temp2 = membre['adhDate'];
                                            const lengtabFact = tabFact.length - 1; 
                                            infoFact = tabFact[lengtabFact];
                                            if(moment(temp2).isBefore(moment(dateNow).format('YYYYMMDD'))) {
                                                membre['adhDate'] = moment(dateNow).add(1, 'years').format('YYYYMMDD');
                                            } else {
                                                membre['adhDate'] = moment(temp2).add(1, 'years').format('YYYYMMDD')
                                            }
                                        }
                                    
                                        if(isFirstAdhesion) {
                                            infoFact = tabFact.pop();
                                         }
                                         
                        //                infoFact = tabFact.pop();
                                        DatePourConjouint = membre['adhDate'];
                                        console.log('firstAdhe', isFirstAdhesion);
                                        return snapshot.data();
                                     }).catch((error) => console.error('Ceci à cosé un problème membre:',  error))
                                     .then(customer => {                                     
                                       const amount = payment.amount;
                                       const idempotency_key = numberId;  // prevent duplicate charges
                                       const source = payment.token.id;
                                       const currency = 'cad';
                                       const charge = {amount, currency, source}; 
        
                                       return stripe.charges.create(charge, { idempotency_key });                 
                                     }).catch((error) => console.error('Ceci à cosé un problème stripe:',  error))
                                     
                                     .then(charge => {                                       
                                         let type: string = 'adhesion';
                                         if(isFirstAdhesion){ type = 'firstAdhesion';
                                         }

                                         const from = 'cooutaouais@outlook.com';
                                         const to = userEmail;
                                         const email = {from, to, type, infoFact}
                                         console.log('membre, charge', charge , membre, email, type, noEmail, noFacture);
                                         docRef.update({membre});
                                         docRef.collection('emails').doc(noEmail+'')
                                        .set(email);
                                        docRef.collection('numerosFac').doc(noFacture+'')
                                             .set(charge);
                                                if(membre['typeCotisation']==='familiale') {
                                                    const docRefConj = admin.firestore().collection('users').doc(membre['courrielConjouint']);                                             
                                                    docRefConj
                                                    .get()
                                                    .then(snapshot => {
                                                        membre = snapshot.data()['membre'];                                      
                                                        membre['adhDate'] =  DatePourConjouint;
                                                        docRefConj.update({membre});
                                                    }).catch((error) => console.error('Ceci à cosé un problème adhDate:', error));
                                                }  
                                                console.log('email', email, type, noEmail, noFacture );                      
                                             return docRef;
                                       }).catch((error) => console.error('Ceci à cosé un problème:','email', noEmail , noFacture,  error))
                                       ;
                                    });
                                }}
                                });
exports.updateEcheance = functions.firestore
                                .document('users/{userEmail}')
                                .onUpdate(event => {
                                    const document = event.data.exists ? event.data.data()['membre']['adhDate'] : null;
                                    const oldDocument = event.data.previous.data()['membre']['adhDate'];
                                    const userEmail = event.params.userEmail;
                                    let type: string = 'avisRenouvellement';
                                    const from = 'cooutaouais@outlook.com';
                                    const to = userEmail;
                                    let jours = 377;
                                    const infoFact = {};
                                    let noEmail: number;
                                    let noFacture: number;
                                    const dateNow = Date.now();
                                    
                                    // Cette fonction s'enclenche si les dates d'adésions sont différente 
                                    if (document !== oldDocument){
                                       
                                     // chercher le no de courriel
                                    const infRef = admin.firestore().collection('informations').doc('numerotation');
                                    infRef.get().then( x => {
                                        const noFac = x.data()['noFacture'];
                                        const noEmai = x.data()['noEmail'];
                                        noEmail = noEmai+3; 
                                        noFacture = noFac;                       
                                        infRef.update({noEmail,noFacture});
                                        return infRef;
                                    }).catch((error) => console.error('Ceci à cosé un problème infoRef:','email', noEmail, error ))
                                .then( z => {
                                    const timerFunction = function() {
                                        setTimeout(function() {
                                            if (jours === 3) {
                                                jours--;
                                                const dateNow2 = Date.now();                     
                                                const docRef = admin.firestore().collection('users').doc(userEmail);                                 
                                                docRef.get().then( _docRef => {
                                                    const value = _docRef.data()['membre']['adhDate'];
                                                    const firstEmail = noEmail-2;
                                                    const email = {from, to, type, infoFact}
        
                                                      if (value === document){                                              
                                                    docRef.collection('emails').doc(firstEmail+'')
                                                    .set(email);
                                                }                                             
                                                  return _docRef
                                                }) 
                                                timerFunction();
                                            } else if (jours === 14) {
                                                jours--;
                                                const dateNow2 = Date.now();                     
                                        const docRef = admin.firestore().collection('users').doc(userEmail);
                                        docRef.get().then( _docRef => {
                                            const value = _docRef.data()['membre']['adhDate'];
                                            const deuxiemeEmail = noEmail-1;
                                            type = 'avisRenouvellement2';                                         
                                            const email = {from, to, type, infoFact}
                                              if (value === document){                                           
                                            docRef.collection('emails').doc(deuxiemeEmail+'')
                                            .set(email);
                                        } 
                                          return _docRef
                                        })
                                                timerFunction();
                                            } else if (jours === 7) {
                                                const dateNow2 = Date.now();                     
                                                const docRef = admin.firestore().collection('users').doc(userEmail);
                                                docRef.get().then( _docRef => {
                                                    const value = _docRef.data()['membre']['adhDate'];
                                                    const troisiemeEmail = noEmail;
                                                    type = 'avisRenouvellement3';
                                                    const email = {from, to, type, infoFact}
                                                      if (value === document){
                                            
                                                    docRef.collection('emails').doc(troisiemeEmail+'')
                                                    .set(email);
                                                } 
                                                   
                                                  return _docRef
                                                }) 
                                            } else {
                                                jours--;
                                                timerFunction();
                                            }
                                        },86400000)};
                                        timerFunction();
                                      return z;
                                
                                    }).catch((error) => console.error('Ceci à cosé un problème premierAvis:','email', noEmail, error ))                             
                                }});

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

exports.updateBd = functions.firestore
                                .document('users')
                                .onUpdate(event => {
                                  const membre = event.data.data();
                                
                          
                                  admin.database()
                                  .ref(`/users`)
                                  .set(membre)   
                                })
