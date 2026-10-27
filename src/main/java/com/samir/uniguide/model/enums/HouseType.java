package com.samir.uniguide.model.enums;

/**
 * Kind of housing in a listing. Stored as text ({@code EnumType.STRING}), so the order
 * of the constants can change without breaking existing rows.
 */
public enum HouseType {
    /** A room in a shared flat (Wohngemeinschaft). */
    WG_ROOM,
    /** A whole flat. */
    APARTMENT,
    /** A room in a student dorm (Studentenwohnheim). */
    DORM
}
