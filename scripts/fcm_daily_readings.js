// Use the secret from environment variables
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

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
        // This ensures the system uses the deep link if handled by the OS
        link: "saints://daily-readings",
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