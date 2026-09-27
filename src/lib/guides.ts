export type Guide = {
  slug: string;
  title: string;
  lede: string;
  sections: { heading: string; body: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "first-tandem-skydive-texas-coast",
    title: "Your first tandem on the Texas coast",
    lede: "What the day actually feels like, from the hangar door to the landing.",
    sections: [
      {
        heading: "The day, in order",
        body: "Plan on 2–3 hours at the dropzone. Check-in and training take 30–45 minutes. The climb is about 20 minutes in a Cessna 182. Freefall from over two miles up lasts about a minute. The canopy ride is 5–7 minutes.",
      },
      {
        heading: "Before you arrive",
        body: "Book ahead so you have a slot. Eat a normal breakfast. Wear athletic clothes you can move in and closed-toe shoes — no flip-flops. A friend on the ground helps more than people expect. If you are over 65, talk to your doctor first.",
      },
      {
        heading: "On the ground",
        body: "You sign the waiver, step on the scale, and pay the balance. Your instructor shows you the body position. If you added video, you meet that person too. Then you gear up and walk to the plane.",
      },
      {
        heading: "The exit",
        body: "The first three seconds feel like a roller coaster. After that the air holds you up, and freefall feels more like floating than falling. The parachute opens, the noise stops, and you can talk on the way in over the island, the ship channel, and the Gulf.",
      },
      {
        heading: "Landing",
        body: "Lift your legs when your instructor says so. Most landings are on your feet or a short slide. Beach landings, on the days we fly them, end on the sand instead of the airport.",
      },
    ],
  },
  {
    slug: "what-beach-landing-means",
    title: "What a beach landing really means",
    lede: "You finish under the parachute on the sand of Mustang Island, not in a field miles from the water.",
    sections: [
      {
        heading: "Not every coastal jump is a beach landing",
        body: "A lot of dropzones fly near a coast and land at the airport. Ours, on the days we schedule it, lands on the beach. Wind, tide, and a conservative go/no-go call decide whether that day is a beach day.",
      },
      {
        heading: "The two beach jumps",
        body: "Beach landing is $499, usually Sundays. Sunset beach landing is $599, Fridays at 6pm. Both include photo and video, a $119 value on a regular tandem.",
      },
      {
        heading: "If the beach is closed",
        body: "We will not force a beach landing in marginal weather. You can take a regular tandem that day, move the beach jump, or take the weather policy: free reschedule, or a full refund up to 72 hours before check-in.",
      },
    ],
  },
  {
    slug: "skydiving-cost-texas",
    title: "What a Texas skydive costs",
    lede: "Our prices, and how they sit next to a normal tandem in Texas.",
    sections: [
      {
        heading: "Here",
        body: "Classic tandem is $259 on Friday and other weekdays, $279 Saturday and Sunday. That is the jump, the instructor, the training, and the gear. Photo and video is $119 more, or video only $99. Beach landing is $499. Sunset beach landing is $599. Both beach jumps include photo and video.",
      },
      {
        heading: "A $100 hold",
        body: "A $100 deposit holds the slot and applies to the total. If weather moves the day, the deposit carries. The rest is collected when you check in.",
      },
      {
        heading: "Around the state",
        body: "Weekday tandems in Texas often land around $200–$260, weekends higher, and a media package often adds $100–$230. Specialty jumps — beach landings, proposals — commonly run $400–$700. We do not teach AFF or solo licensing here. That path is a different dropzone and a much larger bill.",
      },
      {
        heading: "Tipping",
        body: "Not required. Most jumpers leave $20–$50 for the instructor, and for the videographer if they had one.",
      },
    ],
  },
  {
    slug: "gulf-coast-skydive-worth-the-drive",
    title: "Is the drive worth it?",
    lede: "Yes, if the view is part of why you want to jump.",
    sections: [
      {
        heading: "How long it takes",
        body: "About 30 minutes from Corpus Christi, across the causeway onto Mustang Island. About 2.5–3 hours from San Antonio. About 3.5–4 hours from Austin. The hangar is 139 Piper Blvd, Hangar #1, Port Aransas.",
      },
      {
        heading: "What you cannot get inland",
        body: "An inland dropzone can give you freefall. It cannot give you Mustang Island, the ship channel, and the Gulf in the same canopy ride. That is the reason people drive.",
      },
    ],
  },
  {
    slug: "weekend-port-aransas-gulf-coast-skydive",
    title: "A Port Aransas weekend with a jump",
    lede: "Put the skydive on the calm morning, then use the rest of the island.",
    sections: [
      {
        heading: "A simple shape",
        body: "Jump on the second morning, when the air is usually calmer and the light is clearer. Afternoon for the beach, a fishing charter, or the ferry. Evening for seafood and live music, that night or the next.",
      },
      {
        heading: "Which jump",
        body: "A classic tandem is $279 on the weekend. If Sunday lines up, the beach landing is the one people drive for. Friday sunset beach landings are the golden-hour version, at 6pm.",
      },
    ],
  },
  {
    slug: "things-to-do-in-port-aransas",
    title: "Things to do in Port Aransas",
    lede: "The island is the point. The jump is the high part of the day.",
    sections: [
      {
        heading: "On the water",
        body: "Mustang Island State Park for a quieter beach. Deep-sea charters for red snapper and kingfish, or bay guides for redfish and trout. Dolphin cruises out of the harbor. Kayaks on the Lydia Ann Channel or the calmer side of the Laguna Madre. The Port Aransas ferry runs free, all day and night, and dolphins often ride the wake.",
      },
      {
        heading: "On land",
        body: "Roberts Point Park and the jetties for an evening walk. A golf course sits by the airport. In winter, Aransas National Wildlife Refuge is one of the better places to see whooping cranes. Downtown has mini-golf and go-karts if you are traveling with kids who are not jumping — jumpers still have to be 18.",
      },
    ],
  },
];

export function guideBySlug(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}
