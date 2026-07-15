'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Fallback pricing data
const defaultPricingPlans = [
  {
    name: 'Russian Manicure',
    price: '$25',
    addOnPrice: '$10+',
    features: ['Nail shaping', 'Cuticle care', 'Polish application', 'Hand massage'],
  },
  {
    name: 'Russian Manicure w/ Extensions',
    price: '$40',
    addOnPrice: '$10+',
    features: ['Nail shaping', 'Cuticle care', 'Gel polish', 'Hand massage', 'Lasts 2-3 weeks'],
  },
  {
    name: 'Nail Art Design',
    price: '$55',
    features: ['Gel manicure included', 'Custom design', 'Multiple colors', 'Rhinestones/decorations'],
  },
  {
    name: 'Nail Extensions',
    price: '$65',
    addOnPrice: '$15+',
    features: ['Full set extensions', 'Acrylic or gel', 'Polish application', 'Free touch-up within 2 weeks'],
  },
  {
    name: 'Classic Pedicure',
    price: '$40',
    features: ['Foot soak', 'Callus removal', 'Nail shaping', 'Polish application', 'Leg massage'],
  },
  {
    name: 'Gel Pedicure',
    price: '$50',
    features: ['Classic pedicure', 'Gel polish', 'Gel toe overlay', 'Lasts 3-4 weeks'],
  },
];

// Configure this URL to point to your Google Sheet CSV export
// Format: https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=0
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQvjSeJtqzg0f4q0D2w4ihCFW6WwStYXpcJMHF7wVfo2iMbrIxuAL4ECPvYCupDsEq-fSuaN_hzI95z/pub?output=csv'; // Add your Google Sheet CSV URL here

type PricingProps = { asPage?: boolean };

export default function Pricing({ asPage }: PricingProps) {
  const [pricingPlans, setPricingPlans] = useState(defaultPricingPlans);
  const HeadingTag = asPage ? 'h1' : 'h2';

  useEffect(() => {
    // Function to parse CSV data
    const parseCSV = (text: string) => {
      const lines = text.split('\n');
      const plans = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles quoted values)
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add last value
        
        // Backward compatible columns:
        // 3 columns: Name, Price, Features
        // 4+ columns: Name, Base Price, Add-on Price, Features
        if (values.length >= 3) {
          if (values.length >= 4) {
            const [name, basePrice, addOnPrice, featuresStr] = values;
            const features = featuresStr ? featuresStr.split(';').map(f => f.trim()).filter(f => f) : [];
            const addOnRaw = (addOnPrice || '').trim();
            let addOnParsed: any = undefined;
            if (addOnRaw) {
              const parts = addOnRaw.split(/[;,]/).map(p => p.trim()).filter(p => p);
              addOnParsed = parts.length > 1 ? parts : parts[0];
            }
            plans.push({
              name: name.trim(),
              price: basePrice.trim(),
              addOnPrice: addOnParsed,
              features: features,
            });
          } else {
            const [name, price, featuresStr] = values;
            const features = featuresStr ? featuresStr.split(';').map(f => f.trim()).filter(f => f) : [];
            plans.push({
              name: name.trim(),
              price: price.trim(),
              features: features,
            });
          }
        }
      }
      
      return plans;
    };

    // Fetch data from Google Sheets if URL is provided
    if (GOOGLE_SHEET_CSV_URL) {
      fetch(GOOGLE_SHEET_CSV_URL)
        .then(response => response.text())
        .then(data => {
          const plans = parseCSV(data);
          if (plans.length > 0) {
            setPricingPlans(plans);
          }
        })
        .catch(error => {
          console.error('Error fetching pricing data:', error);
        });
    }
  }, []);

  return (
    <section id={asPage ? undefined : 'pricing'} className="section-padding section-white">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6"
      >
        {!asPage && <div id="pricing" style={{ scrollMarginTop: '180px', height: 0 }} />}
        <HeadingTag className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-center mb-3 sm:mb-4 px-2 sm:px-3 text-[#1c1917]">
          Pricing
        </HeadingTag>
        <div className="brand-rule w-24 mx-auto mb-4" aria-hidden />
        <p className="text-center text-[#78716c] mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-2 sm:px-3 text-sm sm:text-base">
          Transparent pricing for all our services
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
              className="bg-white p-5 sm:p-6 border border-[#e7e2db] hover:border-[#c4b5a0] transition-colors flex flex-col shadow-[0_8px_30px_rgba(28,25,23,0.04)]"
            >
              <h3 className="text-xl sm:text-2xl font-heading mb-2 text-[#111]">{plan.name}</h3>
              <div className="mb-3">
                <div className="text-2xl sm:text-3xl font-medium tabular-nums text-[#111]">{(plan as any).price}</div>
                {(plan as any).addOnPrice && (
                  <div className="text-xs text-[#a1a1aa] mt-1">
                    <div className="font-medium text-[#71717a]">Add-ons:</div>
                    {Array.isArray((plan as any).addOnPrice) ? (
                      <ul className="mt-0.5 space-y-0">
                        {(plan as any).addOnPrice.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-0.5">{(plan as any).addOnPrice}</div>
                    )}
                  </div>
                )}
              </div>
              <ul className="space-y-1.5 mb-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start min-h-[1.5rem]">
                    <span className="text-[#a1a1aa] mr-2 flex-shrink-0 mt-0.5">·</span>
                    <span className="text-[#71717a] text-sm leading-normal">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs mb-4 text-[#71717a]">
                <p className="mb-1 text-center leading-snug">• All nail services come with 5 days warranty.</p>
                <p className="text-[10px] sm:text-xs text-[#52525b] text-center leading-snug">
                  • ₱500 per slot advance deposit upon booking is required to secure your slot(s); non-refundable, but deductible from the total payment.
                </p>
              </div>
              <Link href="/booking" className="brand-cta w-full mt-auto text-center text-sm">
                Book Now
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

