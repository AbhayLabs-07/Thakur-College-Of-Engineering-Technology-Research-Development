import React from 'react';
import { ShoppingCart, Check, Info } from 'lucide-react';

const ComponentCard = ({ component, onAddToCart, isGlowing = false, quantityInCart = 0 }) => {
  const isAvailable = component.quantityAvailable > 0;

  return (
    <div className={`bg-white border-2 flex flex-col justify-between h-full transition-all ${
      isGlowing 
        ? 'recommendation-glow scale-[1.01]' 
        : 'border-slate-300 hover:border-tcet-navy shadow-sm hover:shadow-md'
    }`}>
      {/* Glow Badge */}
      {isGlowing && (
        <div className="bg-tcet-gold text-tcet-navy text-[10px] font-black uppercase tracking-wider px-2 py-1 text-center border-b border-tcet-navy">
          ★ Recommended for Your Project
        </div>
      )}

      {/* Image Container */}
      <div className="relative h-44 bg-slate-100 border-b border-slate-200 overflow-hidden flex items-center justify-center">
        {component.imageUrl ? (
          <img 
            src={component.imageUrl} 
            alt={component.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
            }}
          />
        ) : (
          <span className="text-tcet-mutedText text-xs font-mono">No Image Available</span>
        )}
        
        {/* Category Badge */}
        <span className="absolute top-2 left-2 bg-tcet-navy text-white text-[10px] font-bold uppercase px-2 py-0.5 tracking-wide">
          {component.category}
        </span>

        {/* Stock Badge */}
        <span className={`absolute bottom-2 right-2 text-[10px] font-extrabold uppercase px-2 py-0.5 border ${
          isAvailable 
            ? 'bg-green-50 border-green-300 text-green-700' 
            : 'bg-red-50 border-red-300 text-red-700'
        }`}>
          {isAvailable ? `${component.quantityAvailable} Available` : 'Out of Stock'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-tcet-navy mb-1 line-clamp-1">{component.name}</h3>
          <p className="text-xs text-tcet-mutedText line-clamp-2 mb-3">{component.description}</p>
        </div>

        {/* Technical Specs List */}
        {component.specs && Object.keys(component.specs).length > 0 && (
          <div className="bg-slate-50 border border-slate-200 p-2 mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-tcet-navy mb-1.5 flex items-center gap-1">
              <Info className="w-3 h-3" /> Technical Specs
            </h4>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
              {Object.entries(component.specs).slice(0, 4).map(([key, val]) => (
                <div key={key} className="truncate">
                  <span className="text-slate-500 font-semibold">{key}:</span> <span className="font-medium text-slate-700">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Add Action */}
      <div className="p-4 pt-0">
        <button
          disabled={!isAvailable}
          onClick={() => onAddToCart(component)}
          className={`w-full py-2.5 font-bold text-xs uppercase tracking-wide border-2 flex items-center justify-center gap-1.5 transition-all ${
            !isAvailable 
              ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
              : quantityInCart > 0
                ? 'bg-green-600 border-green-600 hover:bg-green-700 text-white'
                : 'bg-tcet-navy border-tcet-navy hover:bg-slate-800 hover:border-slate-800 text-white'
          }`}
        >
          {quantityInCart > 0 ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added ({quantityInCart})</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>ADD TO CART</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ComponentCard;
