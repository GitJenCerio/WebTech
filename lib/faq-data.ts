export interface FAQItem {
  question: string;
  answer: string | string[];
}

export interface FAQSection {
  title: string;
  items: FAQItem[];
}

export const faqSections: FAQSection[] = [
  {
    title: 'Appointments & Booking',
    items: [
      {
        question: 'Do you accept walk-ins?',
        answer: 'My studio operates strictly by appointment only to give each client the proper time and care they deserve.',
      },
      {
        question: 'Do you accept same-day bookings?',
        answer: 'Yes, same-day bookings are accepted depending on availability. Please note that a squeeze-in fee may apply for rush appointments.',
      },
      {
        question: 'How do I book an appointment?',
        answer: "You can book through my official booking form, social media page, or by messaging directly. Once your slot is confirmed, you'll receive the details and preparation reminders.",
      },
      {
        question: 'Is there a deposit required?',
        answer: 'Yes, a ₱500 deposit is required to secure your appointment. This will be deducted from your total bill during your visit. Deposits are non-refundable but may be transferred if you reschedule within the allowed timeframe.',
      },
      {
        question: "What if I'm late?",
        answer: [
          '15 minutes late = ₱200 late fee',
          '30 minutes late = Appointment cancelled and deposit forfeited',
        ],
      },
      {
        question: 'Can I reschedule?',
        answer: [
          'Yes, rescheduling is allowed up to 3 days before your appointment. A ₱200 rescheduling fee applies and must be settled before confirming your new slot.',
          'Failure to reschedule within the timeframe will result in deposit forfeiture.',
        ],
      },
    ],
  },
  {
    title: 'Russian Manicure & Services',
    items: [
      {
        question: 'Does the Russian Manicure hurt?',
        answer: "No, it should never hurt. It's a gentle, detailed process. If you ever feel discomfort, please let your nail tech know right away so adjustments can be made.",
      },
      {
        question: 'What makes the Russian Manicure special?',
        answer: "It uses a precise e-file technique to clean and refine the cuticles safely, giving a super clean and long-lasting result. It's perfect for those who want flawless, natural-looking nails.",
      },
      {
        question: 'Can men book a Russian Manicure?',
        answer: "Yes! It's ideal for men who prefer a clean, well-groomed look. Clear or natural builder gel can also be added for extra strength and shine.",
      },
      {
        question: 'Can I book both manicure and pedicure in one session?',
        answer: 'Yes! You can book both — just inform your nail tech in advance so the schedule can be properly adjusted.',
      },
    ],
  },
  {
    title: 'Studio Rules & Comfort',
    items: [
      {
        question: 'Can I bring a companion?',
        answer: 'Yes, one companion per client is allowed to maintain a peaceful atmosphere. Please inform them about the procedure length, as sessions can take time. A relaxed environment helps ensure your nails turn out perfectly!',
      },
      {
        question: 'Can I bring my child?',
        answer: "Yes, you may bring your child as long as they can stay calm and behave during the session. There's a TV available in the studio so your child can watch while we do your nails.",
      },
      {
        question: 'Do you have pets?',
        answer: [
          'Yes 🐶 I have two friendly dogs — a Shih Tzu and a Mini Pinscher. They may greet you when you arrive but will settle down soon after.',
          'If you have dog allergies or asthma, I recommend booking a home service instead for your safety and comfort.',
        ],
      },
      {
        question: 'Is there parking available?',
        answer: "There's no dedicated parking space, but street parking is available near the studio. Please plan accordingly.",
      },
    ],
  },
  {
    title: 'During Your Session',
    items: [
      {
        question: 'What should I do during the procedure?',
        answer: 'Once your session starts, please keep your hands steady and relaxed. Avoid touching anything that may cause dust or hair to stick to your nails.',
      },
      {
        question: 'Can I use my phone?',
        answer: 'You may use your phone in between steps, but please minimize movement once the polishing or intricate detailing begins.',
      },
      {
        question: 'Can I take breaks?',
        answer: 'Of course! You can request a water, CR, or stretch break anytime. Your comfort always comes first.',
      },
      {
        question: 'What if I feel burning during gel curing?',
        answer: 'A mild warm sensation is normal, but if it feels hot, gently pull your hand out of the lamp and let your nail tech know.',
      },
      {
        question: 'Can I send an inspo photo before my appointment?',
        answer: 'Yes, please do! Sending your nail design inspiration in advance helps your nail tech prepare materials and plan the design ahead — especially for intricate nail art.',
      },
    ],
  },
  {
    title: 'Payments & Fees',
    items: [
      {
        question: 'How much are your services?',
        answer: 'Prices depend on your chosen service and design complexity. A full price list is available on the Pricing page or by message upon request.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'I accept Cash, GCash, and PNB transfers.',
      },
      {
        question: 'Is the deposit deductible from the total?',
        answer: 'Yes, your ₱500 deposit will be deducted from your final total on the day of your appointment.',
      },
    ],
  },
  {
    title: 'Aftercare & Nail Maintenance',
    items: [
      {
        question: 'How long will my nails last?',
        answer: 'With proper care, your gel or builder nails can last 3–5 weeks, depending on your daily activities.',
      },
      {
        question: "What's the best way to care for my nails?",
        answer: [
          'Moisturize cuticles regularly with cuticle oil.',
          'Avoid using your nails as tools.',
          'Wear gloves when washing dishes or cleaning.',
          'Schedule a refill or removal once your nails grow out.',
        ],
      },
      {
        question: 'Can I remove my gel or extensions at home?',
        answer: "It's not recommended. DIY removal can cause damage to your natural nails. Book a professional removal for safe and proper care.",
      },
    ],
  },
  {
    title: 'Studio Information & Amenities',
    items: [
      {
        question: 'Location',
        answer: '701-B Carola, Sampaloc, Manila\n(Google Map Pin: Granma Laundry Shoppe)',
      },
      {
        question: 'Do you serve clients outside Manila?',
        answer: 'Yes. I’m a private home studio in Manila and serve clients across Metro Manila—including Quezon City, Makati, Pasig, Taguig, and nearby areas. By appointment only, with limited daily slots.',
      },
      {
        question: 'Studio Hours',
        answer: 'By appointment only — please confirm your slot before visiting.',
      },
      {
        question: 'Amenities & Reminders',
        answer: [
          'Feel free to ask for water, charger, or a CR break anytime.',
          'Wi-Fi and TV available for your comfort.',
          'Please relax and enjoy your session — quality takes time.',
          'Your comfort and satisfaction are always my top priority! ✨',
        ],
      },
    ],
  },
];
