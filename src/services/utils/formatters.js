export const indianRupeeFormat = (
  number /*= 0*/,
  digit = 2,
  showPlus = false,
  returnDefault = "0.00"
) => {
  if (isNaN(Number(number)) || !number) {
    return returnDefault;
  }
  const rupeesValue = Number(number).toLocaleString("en-IN", {
    maximumFractionDigits: digit,
    style: "currency",
    currency: "INR",
  });
  const ans =
    Number(number) < 0
      ? `-${rupeesValue.slice(2)}`
      : showPlus
        ? Number(number == 0)
          ? `${rupeesValue.slice(1)}`
          : `+${rupeesValue.slice(1)}`
        : rupeesValue.slice(1);
  // return rupeesValue.slice(ansDigit)
  // if(ans=='NaN') return "0.00"
  return ans;
};

export const getNumberInKLCr = (number = 0, digit = 2) => {
  if (number == 0 || !number) return "0.00";
  return (number < 1000 && number > -1000)
    ? indianRupeeFormat(number, digit)
    : (number < 100000 && number > -100000)
      ? `${indianRupeeFormat(number / 1000, digit)}k`
      : (number < 10000000 && number > -10000000)
        ? `${indianRupeeFormat(number / 100000, digit)}L`
        : `${indianRupeeFormat(number / 10000000, digit)}Cr`;
};

export const getPnlColor = (number = 0, light = false) => {
  if (number === 0 || !number) return "#6B7A90";
  return number > 0
    ? `rgba(71, 182, 82, ${light ? "0.18" : "1"})`
    : `rgba(231, 19, 19,  ${light ? "0.18" : "1"})`;
};

export const getBackgroundPnlColor = (number, light = false) => {
  // if (number == 0 || !number) return "#6B7A90";
  return number > 0 ? "rgb(237, 255, 239, 0.9)" : "rgba(255, 0, 0, 0.3)";
};

export const getPnlTextClass = (
  number,
  {
    positive = "text-green-600 dark:text-green-400",
    negative = "text-red-500 dark:text-red-400",
    neutral = "text-gray-400 dark:text-gray-500",
  } = {}
) => {
  const value = Number(number);
  if (!Number.isFinite(value) || value === 0) return neutral;
  return value > 0 ? positive : negative;
};
