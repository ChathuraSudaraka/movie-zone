// Donation tracking utility
export interface DonationData {
  paypalOrderId: string;
  amount: number;
  donorName?: string;
  message?: string;
  isAnonymous: boolean;
  timestamp: string;
  tier: string;
}

export const saveDonationRecord = async (donationData: DonationData): Promise<void> => {
  try {
    // Here you would typically send the donation data to your backend
    // For now, we'll save to localStorage for demo purposes
    
    const existingDonations = JSON.parse(localStorage.getItem('donations') || '[]');
    existingDonations.push(donationData);
    localStorage.setItem('donations', JSON.stringify(existingDonations));
    
    console.log('Donation recorded:', donationData);
    
    // If you have Supabase set up, you could also save there:
    // const { error } = await supabase
    //   .from('donations')
    //   .insert([donationData]);
    // 
    // if (error) throw error;
    
  } catch (error) {
    console.error('Failed to save donation record:', error);
  }
};

export const getDonationStats = (): { totalAmount: number; donationCount: number } => {
  try {
    const donations: DonationData[] = JSON.parse(localStorage.getItem('donations') || '[]');
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    return {
      totalAmount,
      donationCount: donations.length
    };
  } catch (error) {
    console.error('Failed to get donation stats:', error);
    return { totalAmount: 0, donationCount: 0 };
  }
};

// Email notification utility (optional)
export const sendDonationNotification = async (donationData: DonationData): Promise<void> => {
  try {
    // You could integrate with EmailJS or another email service here
    // to notify admins about new donations
    
    console.log('Would send donation notification for:', donationData);
    
  } catch (error) {
    console.error('Failed to send donation notification:', error);
  }
};