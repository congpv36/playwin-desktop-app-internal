const LoadingLogin = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-10 h-10 border-4 border-brand-color border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-semibold text-white">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingLogin
