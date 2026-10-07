import { useState } from 'react';
import { housingListings, type PriceBand, type RoomType } from '../mock/studentHub';

export function HousingPage() {
  const [priceFilter, setPriceFilter] = useState<PriceBand | 'any'>('any');
  const [roomFilter, setRoomFilter] = useState<RoomType | 'any'>('any');

  const filtered = housingListings.filter((h) => {
    if (priceFilter !== 'any' && h.priceBand !== priceFilter) return false;
    if (roomFilter !== 'any' && h.roomType !== roomFilter) return false;
    return true;
  });

  return (
    <div className="page-wide">
      <h1>Find housing</h1>
      <p className="status-message" style={{ display: 'block', margin: '0 0 1.5rem' }}>
        {filtered.length} places match your filters
      </p>

      <div className="filters">
        <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value as PriceBand | 'any')}>
          <option value="any">Any price</option>
          <option value="low">Under €400</option>
          <option value="mid">€400–650</option>
          <option value="high">€650+</option>
        </select>
        <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value as RoomType | 'any')}>
          <option value="any">Any room type</option>
          <option value="Studio">Studio</option>
          <option value="WG/Shared">WG / Shared</option>
          <option value="Dorm">Dorm</option>
        </select>
      </div>

      <div className="housing-grid">
        {filtered.map((listing) => (
          <div key={listing.id} className="housing-card">
            <div className="housing-photo">listing photo</div>
            <div className="housing-body">
              <div className="housing-title">{listing.title}</div>
              <div className="housing-meta">{listing.district} · {listing.size}</div>
              <div className="housing-tags">
                <span className="housing-tag">{listing.roomType}</span>
                {listing.furnished && <span className="housing-tag">Furnished</span>}
              </div>
              <div className="housing-footer">
                <span className="housing-price">{listing.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
