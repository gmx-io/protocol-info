// date format: d MMM yyyy, H:mm, time should be specifed based on UTC time

export type EventData = {
  id: string;
  title: string;
  isActive?: boolean;
  validTill: string;
  bodyText: string | string[];
  buttons?: {
    text: string;
    link: string;
    newTab?: boolean;
  }[];
};

export const homeEventsData: EventData[] = [
  {
    id: "v2-live",
    title: "GMX V2 beta is live",
    isActive: true,
    validTill: "9 Sep 2023, 12:00",
    bodyText: "GMX V2 beta is now available for public use.",
    buttons: [
      {
        text: "Read More",
        link: "https://gmxio.substack.com/p/gmx-v2-beta-is-now-live",
        newTab: true,
      },
      {
        text: "Use V2",
        link: "https://app.gmx.io/#/v2?no_redirect",
      },
    ],
  },
];
