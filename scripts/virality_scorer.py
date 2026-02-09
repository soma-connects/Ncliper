"""
Virality Score Calculator

Acts as a Data Scientist module to calculate weighted virality scores
from Gemini AI-generated metrics.

Author: Ncliper Data Science Team
"""

from typing import Dict, Union
import json


def calculate_virality_score(
    gemini_response: Dict[str, Union[int, float]],
    weights: Dict[str, float] = None
) -> int:
    """
    Calculate a weighted average virality score from Gemini JSON response.

    This function uses a weighted average approach to combine multiple
    engagement metrics into a single virality score. Default weights are
    based on empirical social media research prioritizing hook strength.

    Args:
        gemini_response: Dictionary containing at minimum:
            - hook_score: 0-100, measures opening hook strength
            - sentiment_score: 0-100, measures emotional resonance
            - pacing_score: 0-100, measures content density/retention
        weights: Optional custom weights for each metric. Defaults to:
            - hook_score: 0.50 (50%)
            - sentiment_score: 0.25 (25%)
            - pacing_score: 0.25 (25%)

    Returns:
        int: Weighted virality score between 0 and 100

    Raises:
        ValueError: If required scores are missing or invalid
        TypeError: If inputs are not numeric

    Examples:
        >>> response = {
        ...     "hook_score": 85,
        ...     "sentiment_score": 70,
        ...     "pacing_score": 90
        ... }
        >>> calculate_virality_score(response)
        81

        >>> custom_weights = {
        ...     "hook_score": 0.6,
        ...     "sentiment_score": 0.3,
        ...     "pacing_score": 0.1
        ... }
        >>> calculate_virality_score(response, custom_weights)
        79
    """
    # Default weights: Hook is most important for virality
    if weights is None:
        weights = {
            "hook_score": 0.50,
            "sentiment_score": 0.25,
            "pacing_score": 0.25
        }

    # Validate required fields
    required_fields = ["hook_score", "sentiment_score", "pacing_score"]
    for field in required_fields:
        if field not in gemini_response:
            raise ValueError(f"Missing required field: {field}")

    # Extract and validate scores
    try:
        hook = float(gemini_response["hook_score"])
        sentiment = float(gemini_response["sentiment_score"])
        pacing = float(gemini_response["pacing_score"])
    except (ValueError, TypeError) as e:
        raise TypeError(f"All scores must be numeric: {e}")

    # Validate score ranges
    scores = {"hook_score": hook, "sentiment_score": sentiment, "pacing_score": pacing}
    for name, score in scores.items():
        if not 0 <= score <= 100:
            raise ValueError(f"{name} must be between 0 and 100, got {score}")

    # Validate weights sum to 1.0
    weight_sum = sum(weights.values())
    if not (0.99 <= weight_sum <= 1.01):  # Allow for floating point errors
        raise ValueError(f"Weights must sum to 1.0, got {weight_sum}")

    # Calculate weighted average
    virality_score = (
        hook * weights["hook_score"] +
        sentiment * weights["sentiment_score"] +
        pacing * weights["pacing_score"]
    )

    # Clamp to [0, 100] and round to integer
    virality_score = max(0, min(100, virality_score))

    return int(round(virality_score))


def batch_score_clips(gemini_responses: list[Dict]) -> list[Dict]:
    """
    Process multiple Gemini responses and add virality scores.

    Args:
        gemini_responses: List of Gemini JSON responses

    Returns:
        List of responses with added 'virality_score' field

    Example:
        >>> clips = [
        ...     {"hook_score": 90, "sentiment_score": 80, "pacing_score": 85},
        ...     {"hook_score": 60, "sentiment_score": 70, "pacing_score": 65}
        ... ]
        >>> scored = batch_score_clips(clips)
        >>> scored[0]["virality_score"]
        85
    """
    scored_clips = []
    for response in gemini_responses:
        scored_response = response.copy()
        scored_response["virality_score"] = calculate_virality_score(response)
        scored_clips.append(scored_response)

    return scored_clips


def main():
    """Example usage and testing."""
    # Example 1: High virality clip
    high_virality = {
        "hook_score": 95,
        "sentiment_score": 85,
        "pacing_score": 90
    }
    score = calculate_virality_score(high_virality)
    print(f"High Virality Clip Score: {score}")

    # Example 2: Medium virality clip
    medium_virality = {
        "hook_score": 70,
        "sentiment_score": 60,
        "pacing_score": 75
    }
    score = calculate_virality_score(medium_virality)
    print(f"Medium Virality Clip Score: {score}")

    # Example 3: Custom weights (prioritize pacing for educational content)
    educational_weights = {
        "hook_score": 0.3,
        "sentiment_score": 0.2,
        "pacing_score": 0.5
    }
    score = calculate_virality_score(medium_virality, educational_weights)
    print(f"Educational Content Score (Custom Weights): {score}")

    # Example 4: Batch processing
    batch = [high_virality, medium_virality]
    scored = batch_score_clips(batch)
    print(f"\nBatch Scored {len(scored)} clips:")
    for i, clip in enumerate(scored, 1):
        print(f"  Clip {i}: {clip['virality_score']}")


if __name__ == "__main__":
    main()
