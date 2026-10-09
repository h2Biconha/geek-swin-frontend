import { describe, expect, it } from "vitest";
import { isValidCep, isValidCpf, isValidEmail, isValidPhone, isValidUf, maskCep, maskCpf, maskPhone } from "@/lib/validate";

describe("validações", () => {
  it("CPF com dígito verificador", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
  it("e-mail", () => {
    expect(isValidEmail("nome@gmail.com")).toBe(true);
    expect(isValidEmail("nome@gmail")).toBe(false);
    expect(isValidEmail("a b@x.com")).toBe(false);
  });
  it("celular com DDD", () => {
    expect(isValidPhone("(11) 91234-5678")).toBe(true);
    expect(isValidPhone("91234-5678")).toBe(false);
  });
  it("CEP e UF", () => {
    expect(isValidCep("01310-100")).toBe(true);
    expect(isValidCep("0131")).toBe(false);
    expect(isValidUf("sp")).toBe(true);
    expect(isValidUf("XX")).toBe(false);
  });
  it("máscaras", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCep("01310100")).toBe("01310-100");
    expect(maskPhone("11912345678")).toBe("(11) 91234-5678");
  });
});
