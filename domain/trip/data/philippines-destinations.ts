import { DestinationSeed, DestinationSpotlight } from "@/domain/trip/types";
import { philippinesDestinationsPartOne } from "@/domain/trip/data/philippines-destinations-part-one";
import { philippinesDestinationsPartTwo } from "@/domain/trip/data/philippines-destinations-part-two";

export const philippinesDestinations: DestinationSeed[] = [
  ...philippinesDestinationsPartOne,
  ...philippinesDestinationsPartTwo
];

export const philippinesFeaturedDestination: DestinationSpotlight = {
  slug: "philippines",
  name: "Philippines",
  country: "Philippines",
  summary:
    "Use the Philippines hub when you want island-first options like Boracay, El Nido, Bohol, and Siargao from one main entry point.",
  tourismUrl: "https://www.itsmorefuninthephilippines.com/"
};
