import Xmark from '@renderer/icons/x-mark'

export const Modal = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white   border border-gray-400 rounded-xl shadow-2xl">
        <div className="flex  justify-between bg-gray-100 rounded-t-xl">
          <p className="pl-2 pr-4 flex items-center ">{title}</p>
          <div
            onClick={onClose}
            className="py-1 px-3 hover:bg-red-600 hover:text-white rounded-tr-lg transition duration-200 ease-in-out"
          >
            <Xmark className=" cursor-pointer size-5 " />
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
