import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
fig = plt.figure(figsize=(4,4))

ax = Axes3D(fig)
ax.scatter(2,3,4)
plt.show()