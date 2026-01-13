import admin from 'firebase-admin';

// Use the secret from environment variables
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("Error: FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
    process.exit(1);
}
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const message = {
    notification: {
        title: "🕊️ A Moment of Peace",
        body: "Your daily reading is ready. Take a moment for your soul today."
    },
    // Data payload is key: it is delivered to your Intent extras 
    // when the app is in the background.
    data: {
        NAVIGATE_TO: "daily-readings"
    },
    topic: "daily_readings",
    android: {
        notification: {
            // Using the default launcher activity is best unless you have 
            // a specific reason for a custom click_action.
            priority: "high"
        }
    }
};

admin.messaging().send(message)
    .then((response) => {
        console.log('Successfully sent message:', response);
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error sending message:', error);
        process.exit(1);
    });