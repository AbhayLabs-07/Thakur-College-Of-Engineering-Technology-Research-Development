import React from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';

const CartDrawer = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveFromCart, onClearCart, onProceedToCheckout, isSubmitting = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 glass-backdrop transition-opacity"
      ></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l-2 border-tcet-navy flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-tcet-navy text-white px-4 py-4 flex justify-between items-center border-b-2 border-tcet-gold">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-tcet-gold" />
              <h2 className="font-bold tracking-wide">CART INVENTORY</h2>
            </div>
            <button onClick={onClose} className="text-white hover:text-tcet-gold transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-semibold mb-1">Your cart is empty</p>
                <p className="text-xs text-slate-400">Browse hardware components and add them to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-tcet-mutedText uppercase">Selected Components</span>
                  <button 
                    onClick={onClearCart}
                    className="text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> CLEAR ALL
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {cartItems.map((item) => (
                    <div key={item.component._id} className="py-4 flex gap-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-slate-100 border border-slate-200 flex-shrink-0">
                        {item.component.imageUrl ? (
                          <img 
                            src={item.component.imageUrl} 
                            alt={item.component.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-mono">No Pic</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-tcet-navy line-clamp-1">{item.component.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 font-semibold">
                            {item.component.category}
                          </span>
                        </div>

                        {/* Adjust Qty */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-slate-300">
                            <button
                              onClick={() => onUpdateQuantity(item.component._id, item.quantity - 1)}
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border-r border-slate-300 text-slate-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-mono font-bold text-tcet-navy">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.component._id, item.quantity + 1)}
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border-l border-slate-300 text-slate-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveFromCart(item.component._id)}
                            className="text-xs text-slate-400 hover:text-red-600 font-bold"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer checkout button */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-200 p-4 sm:p-6 bg-slate-50 space-y-4">
              <div className="flex justify-between text-sm font-bold text-tcet-navy uppercase">
                <span>Total Items</span>
                <span>{cartItems.reduce((acc, curr) => acc + curr.quantity, 0)}</span>
              </div>
              
              <button
                onClick={onProceedToCheckout}
                disabled={isSubmitting}
                className={`w-full py-3 text-white font-bold text-sm uppercase tracking-wider border-2 border-tcet-navy transition-all ${
                  isSubmitting ? 'bg-slate-500 cursor-not-allowed opacity-75' : 'bg-tcet-navy hover:bg-slate-800'
                }`}
              >
                {isSubmitting ? 'SUBMITTING REQUEST...' : 'PROCEED TO CHECKOUT'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
