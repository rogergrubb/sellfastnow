// Utility functions for transaction cancellation

export function calculateCancellationTiming(
  scheduledMeetupTime?: Date | string,
  cancellationTime: Date = new Date()
): string {
  if (!scheduledMeetupTime) {
    return "unscheduled";
  }

  const meetupDate = typeof scheduledMeetupTime === "string" 
    ? new Date(scheduledMeetupTime) 
    : scheduledMeetupTime;
  
  const cancelDate = cancellationTime;
  
  // Calculate hours until meetup
  const hoursUntilMeetup = (meetupDate.getTime() - cancelDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilMeetup < 0) {
    return "after_scheduled_time";
  } else if (hoursUntilMeetup < 2) {
    return "last_minute";
  } else if (hoursUntilMeetup < 6) {
    return "same_day";
  } else if (hoursUntilMeetup < 24) {
    return "one_day_before";
  } else if (hoursUntilMeetup < 72) {
    return "few_days_before";
  } else {
    return "well_in_advance";
  }
}

export function getCancellationTimingLabel(timing: string): string {
  const labels: Record<string, string> = {
    last_minute: "Cancelled 2 hours before meetup",
    same_day: "Cancelled same day",
    one_day_before: "Cancelled 1 day before",
    few_days_before: "Cancelled few days before",
    well_in_advance: "Cancelled well in advance",
    after_scheduled_time: "Cancelled after scheduled time",
    unscheduled: "Cancelled",
  };
  
  return labels[timing] || "Cancelled";
}
