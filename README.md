## PVE Solax Management

_A simple management system for controlling PVE Solax_

**Important notice:** I am not responsible for damage or system failures. The user is fully responsible for all damages.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Installation

The entire application is delivered in source code so that the user/programmer can build the application themselves or adapt it to his/her needs. It is necessary to have a web server ready, e.g. Apache (v. 2.4.59) and PHP (v. 7.3.31). The installation procedure for Apache or PHP is not the subject of this readme.

We will copy the contents of the `/dist` folder to the root folder of the website. Then we will change the permissions of the `/api/data` directory to write and read by Apache or PHP. Files with OTE (OTE = "Operátor trhu s elektřinou"; Electricity Market Operator) prices, charging, output from the launcher and settings will be written to this directory.

It is also necessary to add repeated script execution, e.g. using cron. The following lines must be added to the launcher configuration:

```plaintext
# Solax Triggers
   44    23  *  *  *  wget -q -t 3 -T 900 -O /dev/null 'http://[your-domain]/api/parser.php?1' > /dev/null
29,59     *  *  *  *  wget -q -t 1 -T 300 -O /dev/null 'http://[your-domain]/api/trigger.php?verbose=1' > /dev/null
   35 19,20  *  *  *  wget -q -t 1 -T 300 -O /dev/null 'http://[your-domain]/api/charger.php' > /dev/null
```

If everything is set up correctly, you can run the application on your domain. It is necessary to set up communication between the application and the WIFI dongle in the "Settings" tab. These are mainly the items "Dongle WIFI identifier" and "IP address". These are mandatory items for communication with the inverter.

![Mandatory settings](/images/settings-en.png)

You can use the "Test connection" button to test the connection with the inverter. After a successful connection, the most important application settings are complete.

_Current supported inverters_
*   _X3 Hybrid G4_

Let it shine!

Petr

---

## Řízení FVE Solax

_Jednoduchý systém řízení pro ovládání PVE Solax_

**Důležité upozornění:** Nenesu žádnou odpovědnost za poškození nebo selhání systému. Za veškeré škody plně odpovídá uživatel.

SOFTWARE JE POSKYTOVÁN "TAK, JAK JE", BEZ JAKÉKOLI ZÁRUKY, AŤ VÝSLOVNÉ NEBO IMPLIKOVANÉ, VČETNĚ, ALE NE VÝHRADNĚ, ZÁRUK PRODEJNOSTI, VHODNOSTI PRO KONKRÉTNÍ ÚČEL A NEPORUŠENÍ PRÁV. AUTOŘI NEBO DRŽITELÉ AUTORSKÝCH PRÁV NEBUDOU V ŽÁDNÉM PŘÍPADĚ ODPOVĚDNÍ ZA JAKÉKOLI NÁROKY, ŠKODY NEBO JINOU ODPOVĚDNOST, AŤ UŽ VZNIKLÉ V RÁMCI SMLOUVY, OBČANSKÉHO PRÁVA NEBO JINAK, VYPLÝVAJÍCÍ Z NEBO V SOUVISLOSTI SE SOFTWAREM NEBO JEHO POUŽITÍM ČI JINÝMI OPERACEMI SE SOFTWAREM.

### Instalace

Celá aplikace je dodávána ve zdrojových kódech, aby měl uživatel/programátor možnost si aplikaci sám sestavit, případně přizpůsobit svým potřebám. Je potřeba mít přichystán webový server, např. Apache (v. 2.4.59) a PHP (v. 7.3.31). Postup instalace Apache nebo PHP není předmětem tohoto readme.

Do kořenové složky rootu webu nakopírujeme obsah složky `/dist`. Následně změníme práva adresáře `/api/data` zápis a čtení Apachem, resp. PHP. Do tohoto adresáře se budou zapisovat soubory s cenami OTE (OTE = „Operátor trhu s elektřinou“), nabíjením, výstupem ze spouštěče a nastavením.

Dále je nutné doplnit pravidelné spouštění skriptů, např. pomocí cronu. Do konfigurace spouštěče je nutné doplnit tyto řádky:

```plaintext
# Spoustece Solax
   44    23  *  *  *  wget -q -t 3 -T 900 -O /dev/null 'http://[vase-domena]/api/parser.php?1' > /dev/null
29,59     *  *  *  *  wget -q -t 1 -T 300 -O /dev/null 'http://[vase-domena]/api/trigger.php?verbose=1' > /dev/null
   35 19,20  *  *  *  wget -q -t 1 -T 300 -O /dev/null 'http://[vase-domena]/api/charger.php' > /dev/null
```

Pokud máme správně vše nastaveno, je možné spustit aplikaci na vaší doméně. Je nezbytné nastavit komunikaci mezi aplikací a WIFI donglem v záložce „Nastavení“. Jde především o položky „Identifikátor WIFI zařízení“ a „IP adresa“. To jsou povinné položky pro komunikaci se střídačem. 

![Povinné nastavení](/images/settings-cs.png)

K otestování spojení se střídačem je možné použít tlačítka „Otestovat spojení“. Po úspěšném spojení je nejdůležitější nastavení aplikace dokončeno.

_Aktuální podporované střídače_
*   _X3 Hybrid G4_

Ať to svítí!

Petr
