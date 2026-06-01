package com.samir.uniguide.model.enums;

public enum University {
    UNI_SIEGEN(City.SIEGEN),
    RUB_BOCHUM(City.BOCHUM),
    RWTH_AACHEN(City.AACHEN);

    private final City city;

    University(City city) { this.city = city;}
    public City getCity() { return city;}
}
