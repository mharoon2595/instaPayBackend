const currYear = new Date().getFullYear();

const vendor = [
  { name: "Flipkart", type: "E-Commerce" },
  { name: "Amazon", type: "E-Commerce" },
  { name: "Lulu Hypermarket", type: "Groceries" },
  { name: "Paragon Restaurant", type: "Dining" },
  { name: "Netmeds", type: "Medicines" },
  { name: "PVR", type: "Movies" },
  { name: "College fees", type: "Education" },
  { name: "School fees", type: "Education" },
  { name: "MakeMyTrip", type: "Travel" },
];

const statementGenerator = () => {
  let data = [];
  const yearsActive = currYear - Math.floor(Math.random() * 10 + 1);

  for (let i = yearsActive; i <= currYear; i++) {
    const yearObj = {
      year: i,
      month: [],
    };
    if (i !== currYear) {
      for (let j = 1; j <= 12; j++) {
        const monthObj = {
          month: j,
          transactions: [],
        };
        for (let k = 1; k < Math.floor(Math.random() * 8 + 1); k++) {
          const vendorIndex = Math.floor(Math.random() * vendor.length);
          const transaction = {
            vendor: vendor[vendorIndex].name,
            category: vendor[vendorIndex].type,
            amount: Math.floor(Math.random() * 10000),
            type: "Debit",
          };
          monthObj.transactions.push(transaction);
        }
        yearObj.month.push(monthObj);
      }
    } else if (i === currYear) {
      for (let j = 1; j < new Date().getMonth() + 1; j++) {
        const monthObj = {
          month: j,
          transactions: [],
        };
        for (let k = 1; k < Math.floor(Math.random() * 8 + 1); k++) {
          const vendorIndex = Math.floor(Math.random() * vendor.length);
          const transaction = {
            vendor: vendor[vendorIndex].name,
            category: vendor[vendorIndex].type,
            amount: Math.floor(Math.random() * 1000),
            type: "Debit",
          };
          monthObj.transactions.push(transaction);
        }
        yearObj.month.push(monthObj);
      }
    }
    data.push(yearObj);
  }

  console.log(
    "LOGGING--->",
    data[data.length - 1].month[data[data.length - 1].month.length - 1]
  );

  let sum = 0;
  data[data.length - 1].month[
    data[data.length - 1].month.length - 1
  ].transactions.forEach((items) => {
    sum += items.amount;
  });

  return { data, outstandingAmount: sum };
};

module.exports = statementGenerator;
