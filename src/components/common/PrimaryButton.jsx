/**
 * Shared call-to-action button with Algorooms primary styling.
 */
const PrimaryButton = ({
  children,
  className = "",
  type = "button",
  disabled = false,
  loading = false,
  as = "button",
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const Component = as;
  const baseClasses = [
    "inline-flex",
    "items-center",
    "justify-center",
    "rounded-lg",
    "font-medium",
    "transition",
    "text-white",
    "bg-[#1B44FE]",
    "hover:bg-[#1534E0]",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-[#1B44FE]",
  ];

  if (isDisabled) {
    baseClasses.push("opacity-60", "cursor-not-allowed");
  }

  const combinedProps = {
    ...rest,
    className: `${baseClasses.join(" ")} ${className}`.trim(),
  };

  if (Component === "button") {
    combinedProps.type = type;
    combinedProps.disabled = isDisabled;
  } else {
    combinedProps.role = combinedProps.role || "button";
    if (isDisabled) {
      combinedProps["aria-disabled"] = true;
      combinedProps.onClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };
    }
  }

  return <Component {...combinedProps}>{children}</Component>;
};

export default PrimaryButton;
