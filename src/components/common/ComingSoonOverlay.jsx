const ComingSoonOverlay = () => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1E1F25] rounded-xl shadow-2xl px-12 py-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Coming Soon...
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          This feature will be available shortly
        </p>
      </div>
    </div>
  );
};

export default ComingSoonOverlay;
