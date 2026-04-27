/* eslint-disable */
// Smoke-test of the README's exhaustive + batch + TypeScript Support examples
// against actual exports. Deleted after typecheck.

import {
  triggerExhaustiveContactEnrichment,
  pollExhaustiveContactEnrichmentResult,
  startBatchContactEnrichment,
  pollBatchContactEnrichment,
  companySearch,
} from "./index.js";
import type { CompanySearchData } from "./index.js";

async function exhaustive(): Promise<void> {
  const trigger: Awaited<
    ReturnType<typeof triggerExhaustiveContactEnrichment>
  > = await triggerExhaustiveContactEnrichment({
    body: {
      apiKey: process.env.FIBERAI_API_KEY!,
      linkedinUrl: "https://www.linkedin.com/in/example",
      enrichmentType: {
        getWorkEmails: true,
        getPersonalEmails: true,
        getPhoneNumbers: true,
      },
    },
  });

  const taskId: string = trigger.data!.output.taskId;

  let done: boolean = false;
  while (!done) {
    await new Promise<void>((resolve) => setTimeout(resolve, 5000));

    const poll: Awaited<
      ReturnType<typeof pollExhaustiveContactEnrichmentResult>
    > = await pollExhaustiveContactEnrichmentResult({
      body: { apiKey: process.env.FIBERAI_API_KEY!, taskId },
    });

    done = poll.data?.output.done ?? false;
    if (done) {
      console.log("Emails:", poll.data?.output.profile.emails);
      console.log("Phones:", poll.data?.output.profile.phoneNumbers);
      console.log("Status:", poll.data?.output.profile.status);
    }
  }
}

async function batch(): Promise<void> {
  const start: Awaited<ReturnType<typeof startBatchContactEnrichment>> =
    await startBatchContactEnrichment({
      body: {
        apiKey: process.env.FIBERAI_API_KEY!,
        personDetails: [
          { linkedinUrl: { value: "https://www.linkedin.com/in/example1" } },
          { linkedinUrl: { value: "https://www.linkedin.com/in/example2" } },
        ],
        enrichmentTypes: {
          getWorkEmails: true,
          getPersonalEmails: true,
          getPhoneNumbers: true,
        },
      },
    });

  const taskId: string = start.data!.output.taskId;
  console.log(`Queued ${start.data!.output.numPeopleEnqueued} profiles`);

  let cursor: string | null | undefined = undefined;
  let done: boolean = false;

  while (!done) {
    await new Promise<void>((resolve) => setTimeout(resolve, 10000));

    const poll: Awaited<ReturnType<typeof pollBatchContactEnrichment>> =
      await pollBatchContactEnrichment({
        body: {
          apiKey: process.env.FIBERAI_API_KEY!,
          taskId,
          cursor,
          take: 100,
        },
      });

    if (!poll.data) break;

    for (const row of poll.data.output.pageResults) {
      console.log(row.inputs.linkedinUrl.value, row.outputs?.emails);
    }

    done = poll.data.output.done;
    cursor = poll.data.output.nextCursor ?? null;

    if (!done && !cursor) await new Promise<void>((r) => setTimeout(r, 5000));
  }
}

async function tsSupport(): Promise<void> {
  const searchParams: CompanySearchData = {
    body: {
      apiKey: process.env.FIBERAI_API_KEY!,
      searchParams: {
        industriesV2: { anyOf: ["Software"] },
        employeeCountV2: {
          lowerBoundExclusive: 100,
          upperBoundInclusive: 1000,
        },
      },
      pageSize: 25,
    },
  };

  const result: Awaited<ReturnType<typeof companySearch>> =
    await companySearch(searchParams);

  if (result.data) {
    console.log(result.data.output.data.length, "companies");
    console.log(result.data.chargeInfo);
  }
}

void exhaustive;
void batch;
void tsSupport;
