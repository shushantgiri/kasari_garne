/** Guide data for rendering: the bundled seed guides, or a guide JSON exported from the admin editor. */
import type { Guide } from "@/lib/content/types";
import { drivingLicence } from "@/lib/content/guides/driving-licence";
import { passport } from "@/lib/content/guides/passport";
import { nationalId } from "@/lib/content/guides/national-id";

export const seedGuides: Guide[] = [drivingLicence, passport, nationalId];
