import { getCustomers } from './customers';

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const customers = await getCustomers();

    // Helper function to parse Firestore timestamps
    const parseDate = (dateValue) => {
      if (!dateValue) return null;
      if (dateValue.toDate) return dateValue.toDate();
      if (dateValue.seconds) return new Date(dateValue.seconds * 1000);
      return new Date(dateValue);
    };

    // Calculate customer statistics
    const totalCustomers = customers.length;
    const uniqueCustomers = new Set(customers.map(c => c.phoneNumber)).size;
    const totalRevenue = customers.reduce((sum, customer) => {
      return sum + (parseFloat(customer.payment?.amount) || 0);
    }, 0);
    const totalPaid = customers.reduce((sum, customer) => {
      return sum + (parseFloat(customer.payment?.paid) || 0);
    }, 0);
    const totalRemaining = customers.reduce((sum, customer) => {
      return sum + (parseFloat(customer.payment?.remaining) || 0);
    }, 0);
    const customersWithPrescription = customers.filter(c => c.hasPrescription).length;
    const customersWithCamera = customers.filter(c => c.hasCamera).length;
    const totalProducts = customers.reduce((sum, customer) => {
      return sum + (customer.products?.length || 0);
    }, 0);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get this week's date range (Monday to Sunday)
    const weekStart = new Date(today);
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get this month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Filter customers by date ranges
    const todayCustomers = customers.filter(customer => {
      const customerDate = parseDate(customer.createdAt);
      return customerDate && customerDate >= today && customerDate <= todayEnd;
    });

    const weekCustomers = customers.filter(customer => {
      const customerDate = parseDate(customer.createdAt);
      return customerDate && customerDate >= weekStart && customerDate <= weekEnd;
    });

    const monthCustomers = customers.filter(customer => {
      const customerDate = parseDate(customer.createdAt);
      return customerDate && customerDate >= monthStart && customerDate <= monthEnd;
    });

    // Calculate revenue for time periods
    const todayRevenue = todayCustomers.reduce((sum, customer) => {
      return sum + (parseFloat(customer.payment?.amount) || 0);
    }, 0);

    const weekRevenue = weekCustomers.reduce((sum, customer) => {
      return sum + (parseFloat(customer.payment?.amount) || 0);
    }, 0);

    const monthRevenue = monthCustomers.reduce((sum, customer) => {
      return sum + (parseFloat(customer.payment?.amount) || 0);
    }, 0);

    // Get recent customers (last 10, sorted by date)
    const recentCustomers = [...customers]
      .sort((a, b) => {
        const dateA = parseDate(a.createdAt);
        const dateB = parseDate(b.createdAt);
        if (!dateA || !dateB) return 0;
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(customer => ({
        ...customer,
        createdAt: parseDate(customer.createdAt)
      }));

    return {
      overview: {
        totalCustomers,
        uniqueCustomers,
        totalRevenue,
        totalPaid,
        totalRemaining,
        customersWithPrescription,
        customersWithCamera,
        totalProducts
      },
      today: {
        revenue: todayRevenue,
        customers: todayCustomers.length
      },
      week: {
        revenue: weekRevenue,
        customers: weekCustomers.length
      },
      month: {
        revenue: monthRevenue,
        customers: monthCustomers.length
      },
      recentCustomers
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

