import { useState } from "react";

// Utility function to get initials from name
const getInitials = (name) => {
  if (!name) return "U";
  const names = name.split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

// Avatar component with fallback to initials
const Avatar = ({
  src,
  name,
  className = "w-10 h-10 rounded-full",
  fallbackBg = "bg-gradient-to-br from-blue-500 to-purple-600",
  textColor = "text-white",
  fontSize = "text-sm",
}) => {
  const [imageError, setImageError] = useState(false);

  // Check if src is valid (not null, undefined, empty string, or just whitespace)
  const isValidSrc =
    src &&
    src.trim() !== "" &&
    !src.includes("null") &&
    !src.includes("undefined");

  if (!isValidSrc || imageError) {
    return (
      <div
        className={`${className} ${fallbackBg} ${textColor} ${fontSize} flex items-center justify-center font-bold select-none`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "User"}
      className={className}
      onError={() => setImageError(true)}
      onLoad={() => setImageError(false)}
    />
  );
};

export default Avatar;
