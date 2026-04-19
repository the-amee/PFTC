import sys

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if '<div class="category-scroll-container">' in line and start_idx == -1:
            start_idx = i
        if start_idx != -1 and '</div>' in line:
            # We need to find the matching closing div for category-scroll-container
            pass # Actually we know it's lines 92 to 116 roughly, let's just use exact line replacement
    
    # Just to be safe, find start index and end index dynamically
    for i, line in enumerate(lines):
        if '<div class="category-scroll-container">' in line:
            start_idx = i
            break
            
    if start_idx != -1:
        # Find the next </section> which is right after our block
        section_end = -1
        for i in range(start_idx, len(lines)):
            if '</section>' in lines[i]:
                section_end = i
                break
                
        if section_end != -1:
            # The div closes right before </section>
            end_idx = section_end - 1
            
            replacement = """        <div class="categories-grid">
            <!-- Category 1 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/veg.png" alt="Fresh Vegetables" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_veg">Fresh Vegetables</h3>
            </a>
            <!-- Category 2 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/fruits.png" alt="Fresh Fruits" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_fruits">Fresh Fruits</h3>
            </a>
            <!-- Category 3 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/dairy.png" alt="Dairy & Eggs" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_dairy">Dairy & Eggs</h3>
            </a>
            <!-- Category 4 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/bakery.png" alt="Bakery" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_bakery">Bakery Products</h3>
            </a>
            <!-- Category 5 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/grocery.png" alt="Grocery & Staples" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_grocery">Grocery & Staples</h3>
            </a>
            <!-- Category 6 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/meat.png" alt="Meat & Seafood" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_meat">Meat & Seafood</h3>
            </a>
            <!-- Category 7 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/personal.png" alt="Personal Care Products" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_personal">Personal Care Products</h3>
            </a>
            <!-- Category 8 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/household.png" alt="Household & Cleaning Products" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_household">Household & Cleaning Products</h3>
            </a>
            <!-- Category 9 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/footwear.png" alt="Footwear & Accessories" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_footwear">Footwear & Accessories</h3>
            </a>
            <!-- Category 10 -->
            <a href="#categories" class="category-card">
                <div class="category-image-wrap">
                    <img src="./assets/categories/pet.png" alt="Pet Food & Supplies" loading="lazy">
                </div>
                <h3 class="category-title" data-i18n="cat_pet">Pet Food & Supplies</h3>
            </a>
        </div>
"""
            
            lines[start_idx:end_idx+1] = [replacement]
            
            with open(filepath, 'w') as f:
                f.writelines(lines)
            print(f"Successfully replaced in {filepath}")
            
replace_in_file('index.html')
replace_in_file('ar.html')

