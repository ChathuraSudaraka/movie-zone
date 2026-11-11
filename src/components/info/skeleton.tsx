import { Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled components for custom skeletons
const ContentSkeleton = styled("div")({
    width: "100%",
    minHeight: "100vh",
    position: "relative",
    backgroundColor: "#050507",
});

const ImageSkeleton = styled(Skeleton)({
    transform: "scale(1, 1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    "&::after": {
        background:
            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)",
    },
});

export const LoadingSkeleton = () => (
    <ContentSkeleton>
        {/* Hero Section Skeleton */}
        <div className="relative h-[90vh]">
            <ImageSkeleton
                variant="rectangular"
                width="100%"
                height="100%"
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent" />

            {/* Content Skeleton */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-16 md:px-8 lg:px-16">
                <div className="max-w-6xl mx-auto space-y-6">
                    <Skeleton
                        variant="text"
                        width="70%"
                        height={80}
                        sx={{ bgcolor: "#1C1C1F" }}
                    />

                    <div className="flex flex-wrap items-center gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="text"
                                width={80}
                                height={24}
                                sx={{ bgcolor: "#1C1C1F" }}
                            />
                        ))}
                    </div>

                    <div className="space-y-3 max-w-3xl">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="text"
                                width={`${90 - i * 15}%`}
                                height={24}
                                sx={{ bgcolor: "#1C1C1F" }}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Skeleton
                            variant="rectangular"
                            width={150}
                            height={48}
                            sx={{ bgcolor: "#1C1C1F", borderRadius: 1 }}
                        />
                        <Skeleton
                            variant="circular"
                            width={48}
                            height={48}
                            sx={{ bgcolor: "#1C1C1F" }}
                        />
                        <Skeleton
                            variant="circular"
                            width={48}
                            height={48}
                            sx={{ bgcolor: "#1C1C1F" }}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Cast Section Skeleton */}
        <div className="px-4 py-12 md:px-8 lg:px-16">
            <div className="max-w-6xl mx-auto">
                <Skeleton
                    variant="text"
                    width={200}
                    height={40}
                    sx={{ bgcolor: "#1C1C1F", marginBottom: 4 }}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <ImageSkeleton
                                variant="rectangular"
                                width="100%"
                                height={0}
                                sx={{
                                    paddingTop: "150%", // 2:3 Aspect Ratio
                                    borderRadius: 1,
                                }}
                            />
                            <Skeleton
                                variant="text"
                                width="80%"
                                height={24}
                                sx={{ bgcolor: "#1C1C1F" }}
                            />
                            <Skeleton
                                variant="text"
                                width="60%"
                                height={20}
                                sx={{ bgcolor: "#1C1C1F" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Additional Info Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="space-y-2">
                                    <Skeleton
                                        variant="text"
                                        width={100}
                                        height={20}
                                        sx={{ bgcolor: "#1C1C1F" }}
                                    />
                                    <Skeleton
                                        variant="text"
                                        width="100%"
                                        height={24}
                                        sx={{ bgcolor: "#1C1C1F" }}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </ContentSkeleton>
);