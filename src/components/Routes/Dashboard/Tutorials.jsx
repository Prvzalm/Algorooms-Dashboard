const Tutorials = ({ tutorials }) => (
  <div className="bg-white dark:bg-darkbg p-4 rounded-xl text-black dark:text-white">
    <h3 className="font-semibold text-lg mb-4">Our Tutorials</h3>
    <div className="space-y-4">
      {tutorials.map((t, i) => (
        <div
          key={i}
          className="flex border border-[#DFEAF2] dark:border-[#1E2027] p-2 rounded-3xl space-x-4 bg-white dark:bg-[#15171C]"
        >
          <img src={t.icon} alt="Tutorial" className="w-24 h-24 rounded-md" />
          <div>
            <p className="font-medium">{t.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.description}
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-500 flex space-x-4 mt-1">
              <span>👍 {t.likes}</span>
              <span>🔁 {t.shares} Shares</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Tutorials;
