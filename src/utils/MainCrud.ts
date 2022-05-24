import db from "./db";

export const saveApplication = async (job: string, candidate: string) => {
  try {
    const existing = await db.application.findFirst({
      where: {
        jobId: job,
        userId: candidate,
      },
    });
    if (!existing) {
      await db.application.create({
        data: {
          jobId: job,
          userId: candidate,
        },
      });

      return {
        result: true,
      };
    } else {
      return {
        result: false,
        message: "already applied",
      };
    }
  } catch (error) {
    console.log(error);
    return { result: false, message: error };
  }
};

export const saveJob = async (job: string, candidate: string) => {
  try {
    const existing = await db.user.findFirst({
      include: {
        savedJobs: true,
      },
      where: {
        AND: {
          id: candidate,
          savedJobs: {
            some: {
              id: job,
            },
          },
        },
      },
    });
    if (!existing) {
      await db.user.update({
        where: {
          id: candidate,
        },
        data: {
          savedJobs: {
            connect: {
              id: job,
            },
          },
        },
      });
    } else {
      await db.user.update({
        where: {
          id: candidate,
        },
        data: {
          savedJobs: {
            disconnect: {
              id: job,
            },
          },
        },
      });
    }

    return {
      result: true,
      messsage: existing ? "unsaved job" : "saved job",
    };
  } catch (error) {
    console.log(error);
    return { result: false, message: error };
  }
};

export const getSavedJobs = async (candidateId: string) => {
  try {
    const candidate = await db.user.findFirst({
      where: {
        id: candidateId,
      },
      include: {
        savedJobs: true,
      },
    });

    return {
      jobs: candidate?.savedJobs,
      result: true,
    };
  } catch (error) {
    console.log(error);
    return { message: error, result: false };
  }
};

export const getCandidatesOnJob = async (jobId: string) => {
  try {
    const job = await db.job.findFirst({
      where: {
        id: jobId,
      },
      include: {
        applications: {
          include: {
            user: true,
          },
        },
      },
    });

    const candidates = job?.applications?.map((app) => app.user);
    return {
      candidates,
      result: true,
    };
  } catch (error) {
    console.log(error);
    return { message: error, result: false };
  }
};
