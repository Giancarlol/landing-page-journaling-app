import { db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export const handleSuccessfulPayment = async (session) => {
  const userId = session.client_reference_id;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    await updateDoc(userRef, {
      subscription: {
        id: subscriptionId,
        status: 'active',
        customerId: customerId,
        priceId: session.line_items.data[0].price.id,
        currentPeriodEnd: new Date(session.subscription.current_period_end * 1000),
        createdAt: new Date(),
      }
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
};

export const handleSubscriptionChange = async (subscription) => {
  // Find user by customer ID
  const querySnapshot = await db.collection('users')
    .where('subscription.customerId', '==', subscription.customer)
    .get();

  if (querySnapshot.empty) {
    console.error('No user found with customer ID:', subscription.customer);
    return;
  }

  const userDoc = querySnapshot.docs[0];
  const userRef = doc(db, 'users', userDoc.id);

  try {
    await updateDoc(userRef, {
      'subscription.status': subscription.status,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
};
