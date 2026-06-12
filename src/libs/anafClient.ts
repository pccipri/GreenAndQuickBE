import { HttpError } from '@/middlewares/errorHandler';

interface AnafSubmissionResponse {
  correlationId: string;
}

interface AnafQueryResult {
  found: Array<{
    date_generale: {
      denumire: string;
      nrRegCom: string;
    };
    stare_inactiv?: {
      statusInactivi?: boolean;
    };
    adresa_sediu_social: {
      sdenumire_Localitate: string;
      sdenumire_Judet: string;
      sdenumire_Strada: string;
      snumar_Strada: string;
      scod_Postal: string;
    };
  }>;
  notFound: any[];
}

/**
 * ANAF Client following Feature 03 specs.
 * Handles the 2-step async CUI validation.
 */
export class AnafClient {
  private static V8_URL = 'https://webservicesp.anaf.ro/AsynchWebService/api/v8/ws/tva';
  private static V7_URL = 'https://webservicesp.anaf.ro/AsynchWebService/api/v7/ws/tva';

  /**
   * Validates a Romanian CUI against the ANAF registry.
   * Rejects if business is inactive or not found.
   */
  static async validateCui(cui: string) {
    const cleanCui = cui.replace(/[^0-9]/g, '');
    const date = new Date().toISOString().split('T')[0];

    // Step 1: Submit CUI to the async queue (v8)
    const postResponse = await fetch(AnafClient.V8_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ cui: parseInt(cleanCui), data: date }]),
    });

    if (!postResponse.ok) throw new HttpError(500, 'ANAF_SUBMISSION_FAILED');
    if (postResponse.status === 400) throw new HttpError(400, 'ANAF_SUBMISSION_FAILED');
    const initialResponse = (await postResponse.json()) as AnafSubmissionResponse;

    const correlationId = initialResponse.correlationId;
    if (!correlationId) {
      throw new HttpError(500, 'ANAF_SUBMISSION_FAILED');
    }

    // Step 2: Poll v7 for results (retry with backoff)
    // Requirement: Wait at least 2 seconds before polling
    const maxAttempts = 5;

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollResponse = await fetch(`${AnafClient.V7_URL}?id=${correlationId}`);
      if (!pollResponse.ok) continue;

      const result = (await pollResponse.json()) as AnafQueryResult;

      // Check if found
      if (result.found && result.found.length > 0) {
        const business = result.found[0];

        // Rule: Inactive businesses are rejected (Feature 03)
        if (business.stare_inactiv?.statusInactivi === true) {
          throw new HttpError(400, 'BUSINESS_INACTIVE');
        }

        return {
          name: business.date_generale.denumire,
          nrRegCom: business.date_generale.nrRegCom,
          cui: cleanCui,
          location: {
            city: business.adresa_sediu_social.sdenumire_Localitate,
            county: business.adresa_sediu_social.sdenumire_Judet,
            street: `${business.adresa_sediu_social.sdenumire_Strada} ${business.adresa_sediu_social.snumar_Strada}`,
            zipcode: business.adresa_sediu_social.scod_Postal,
            country: 'Romania',
          },
        };
      }

      if (result.notFound && result.notFound.length > 0) {
        throw new HttpError(404, 'CUI_NOT_FOUND');
      }
    }

    throw new HttpError(500, 'ANAF_TIMEOUT');
  }
}
