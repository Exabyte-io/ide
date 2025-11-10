export const QUEUE_TYPES = {
    debug: "D",
    ordinaryRegular: "OR",
    ordinaryRegular4: "OR4",
    ordinaryRegular8: "OR8",
    ordinaryRegular16: "OR16",
    savingRegular: "SR",
    savingRegular4: "SR4",
    savingRegular8: "SR8",
    savingRegular16: "SR16",
    ordinaryFast: "OF",
    ordinaryFastPlus: "OFplus",
    savingFast: "SF",
    savingFastPlus: "SFplus",
    gpuOrdinaryFast: "GOF",
    gpu4OrdinaryFast: "G4OF",
    gpu8OrdinaryFast: "G8OF",
    gpuPOrdinaryFast: "GPOF",
    gpuP2OrdinaryFast: "GP2OF",
    gpuP4OrdinaryFast: "GP4OF",
    gpuSavingFast: "GSF",
    gpu4SavingFast: "G4SF",
    gpu8SavingFast: "G8SF",
    gpuPSavingFast: "GPSF",
    gpuP2SavingFast: "GP2SF",
    gpuP4SavingFast: "GP4SF",
};

export const QUEUE_DISPLAY = {
    D: "debug (D)",
    OR: "ordinary regular (OR)",
    OR4: "4 cores ordinary regular (OR4)",
    OR8: "8 cores ordinary regular (OR8)",
    OR16: "16 cores ordinary regular (OR16)",
    SR: "saving regular (SR)",
    SR4: "4 cores saving regular (SR4)",
    SR8: "8 cores saving regular (SR8)",
    SR16: "16 cores saving regular (SR16)",
    OF: "ordinary fast (OF)",
    "OF+": "ordinary fast plus (OF+)",
    OFplus: "ordinary fast plus (OFplus)",
    SF: "saving fast (SF)",
    "SF+": "saving fast plus (SF+)",
    SFplus: "saving fast plus (SFplus)",
    GOF: "1 GPU ordinary fast (GOF)",
    G4OF: "4 GPUs ordinary fast (G4OF)",
    G8OF: "8 GPUs ordinary fast (G8OF)",
    GPOF: "1 P100 GPU ordinary fast (GPOF)",
    GP2OF: "2 P100 GPUs ordinary fast (GP2OF)",
    GP4OF: "4 P100 GPUs ordinary fast (GP4OF)",
    GSF: "1 GPU saving fast (GSF)",
    G4SF: "4 GPUs saving fast (G4SF)",
    G8SF: "8 GPUs saving fast (G8SF)",
    GPSF: "1 P100 GPU saving fast (GPSF)",
    GP2SF: "2 P100 GPUs saving fast (GP2SF)",
    GP4SF: "4 P100 GPUs saving fast (GP4SF)",
};
export const ETA = {
    withinOneMin: {
        display: "within 1 min",
        order: 10,
    },
    withinFiveMin: {
        display: "less than 5 min",
        order: 20,
    },
    withinTenMin: {
        display: "within 10 min",
        order: 30,
    },
    withinOneHour: {
        display: "within 1 hour",
        order: 40,
    },
    moreThanHour: {
        display: "more than 1 hour",
        order: 50,
    },
};
export const TIME_LIMIT_TYPES = {
    single: "per single attempt",
    compound: "compound",
};

export const IS_RESTARTABLE = {
    yes: true,
    no: false,
};
