import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
};

const bgColors = {
    success: 'bg-green-50 border-green-100',
    error: 'bg-red-50 border-red-100',
    info: 'bg-blue-50 border-blue-100'
};

export default function Toast({ id, type = 'info', message, onClose, duration = 3000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    return (
        <div className={`flex items-center w-full max-w-sm p-4 mb-4 text-gray-700 bg-white rounded-lg shadow-lg border-l-4 ${type === 'success' ? 'border-green-500' : type === 'error' ? 'border-red-500' : 'border-blue-500'} animate-slide-in`}>
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-transparent">
                {icons[type]}
            </div>
            <div className="ml-3 text-sm font-medium">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
                onClick={() => onClose(id)}
            >
                <span className="sr-only">Close</span>
                <X size={16} />
            </button>
        </div>
    );
}
